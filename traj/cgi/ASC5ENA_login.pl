#!/usr/bin/perl
# User registration script.
use strict;
use warnings;

use CGI;
use CGI::Cookie;
use POSIX;
use DBI;

# my $host = 'http://localhost';
my $host = 'https://fugue.arp.harvard.edu';
my $html = $host . '/ASC5ENA.dev';
 
main();

sub setup_session_key {
  my ($dbh, $UserID) = @_;
  my $key = "K" . (time() * floor(rand(1000000)));
  $dbh->do('INSERT INTO Session (Session_Key, UserID)
    VALUES ( ?, ? )', {}, $key, $UserID);
  return CGI::Cookie->new(
    -name => 'ASC5ENA_Session',
    -value => $key,
    -path => '/cgi-bin');
}

sub create_confirmation_key {
  use Mail::Sendmail;
  my ($dbh, $UserID, $Email, $mode) = @_;
  my $try;
  my $key;
  for ($try = 0; $try < 3; ++$try) {
    $key = "K" . time() . floor(rand(1000000));
    eval {
      $dbh->do('INSERT INTO Confirmation (ConfKey, UserID)
        VALUES (?, ?)', {}, $key, $UserID);
    };
    last unless $@;
  }
  if ($try >= 3) {
    return "Failure: Unable to insert into Confirmation: $@";
  }
  my $message;
  my $subject;
  if ($mode eq 'new') {
    $message = "Please follow this link to confirm your email " . 
      "address for the ASC5ENA Flight Simulator:";
    $subject = "ASC5ENA Flight Simulator Email Confirmation";
  } else {
    $message = "Please follow this link to reset your password:";
    $subject = "ASC5ENA Flight Simulator Password Reset";
  }
  $message .= "\n\n  " .
      $host . "/cgi-bin/ASC5ENA_login.pl?req=confirm&key=$key";
  if ( sendmail(
      To => $Email,
      From => 'webmaster@huarp.harvard.edu',
      Subject => $subject,
      smtp => 'endymion.arp.harvard.edu',
      Message => $message ) )
  {
    return "Success: email sent, key=$key";
  } else {
    return "Failure: Sendmail failed";
  }
    
}
      
sub main {
  my $cgi  = CGI->new();
  my %rv;
  my $status = 'Fail: Unknown Request';
  my $req = $cgi->param('req') || 'none';
  my %header = ( -type => 'application/json' );
  my $dbh = DBI->connect(
      "DBI:mysql:host=127.0.0.1;database=ASC5ENA",
      'asc5ena', '5zzy$3kN3qBV7W',
      { PrintError => 0, RaiseError => 1 } );
  if ($req eq 'initialize') {
    my %cookies = CGI::Cookie->fetch;
    my $key = $cookies{ASC5ENA_Session};
    if ( $key ) {
      $key = $key->value;
      my ($user, $passhash, $confirmed) = $dbh->selectrow_array(
        'SELECT FullName, Password, Confirmed FROM Session
          NATURAL JOIN User
          WHERE Session_Key = ?', {}, $key);
      if (defined($user)) {
        if ($passhash ne '') {
          $status = 'Success: logged_in';
          $rv{fullname} = $user;
        } elsif ($confirmed) {
          $status = "Success: logged_in ('$user' confirmed, no password)";
          $rv{fullname} = $user;
        } else {
          $status = "Success: logged_out ('$user' unconfirmed)";
        }
      } else {
        $status = 'Success: logged_out (with invalid cookie)';
      }
    } else {
      $status = 'Success: logged_out (no cookie)';
    }
  } elsif ($req eq 'login') {
    my $username = $cgi->param('username');
    my $password = $cgi->param('password');
    my ($UserID, $FullName) = $dbh->selectrow_array(
      'SELECT UserID, FullName FROM User
       WHERE Username = ? AND Password = MD5(?)',
      {}, $username, $password );
    if ( $UserID && $FullName ) {
      $status = "Success: logged_in";
      $rv{user} = $FullName;
      $header{-cookie} = setup_session_key($dbh, $UserID);
    } else {
      $status = 'Failure: Invalid user or password';
    }
  } elsif ($req eq 'logout') {
    my %cookies = CGI::Cookie->fetch;
    my $key = $cookies{ASC5ENA_Session};
    $status = 'Success: logged_out';
    if ( $key ) {
      my $Session_Key = $key->value;
      $dbh->do('DELETE FROM Session WHERE Session_Key = ?', {}, $Session_Key);
      $key->value('K0');
      $key->path('/cgi-bin');
      $header{-cookie} = $key;
    }
  } elsif ($req eq 'create_user') {
    # Setup User record and session, but password is empty
    my $Username = $cgi->param('username');
    my $FullName = $cgi->param('fullname');
    my $Email = $cgi->param('email');
    eval {
      $dbh->do('INSERT INTO User (Username, Password, FullName, Email)
        VALUES (?, ?, ?, ?)', {}, $Username, '', $FullName, $Email);
    };
    if ( $@ ) {
      if ( $@ =~ m/Duplicate entry/ ) {
        $status = "Failure: Specified username or email already exists: $@";
        chomp $status;
      } else {
        $status = "Failure: $@";
      }
    } else {
      my $UserID = $dbh->{mysql_insertid};
      $header{-cookie} = setup_session_key($dbh, $UserID);
      $status = create_confirmation_key($dbh, $UserID, $Email, 'new');
    }
  } elsif ($req eq 'passwd_set') {
    my %cookies = CGI::Cookie->fetch;
    my $key = $cookies{ASC5ENA_Session};
    if ( $key ) {
      my $Session_Key = $key->value;
      my ($UserID, $confirmed) = $dbh->selectrow_array(
        'SELECT UserID, Confirmed FROM Session
          NATURAL JOIN User
          WHERE Session_Key = ?', {}, $Session_Key);
      if ($UserID && $confirmed) {
        my $password = $cgi->param('password');
        $dbh->do("UPDATE User SET Password = MD5(?) WHERE UserID = ?",
          {}, $password, $UserID);
        $status = "Success: logged_in";
      } else {
        $status = "Failure: Unable to confirm session";
      }
    }
  } elsif ($req eq 'forgot_pw') {
    my ($UserID, $Email) = $dbh->selectrow_array(
      'SELECT UserID, Email FROM User WHERE Email = ?',
      {}, $cgi->param('email'));
    if ($UserID) {
      $header{-cookie} = setup_session_key($dbh, $UserID);
      $status = create_confirmation_key($dbh, $UserID, $Email, 'reset');
    }
  } elsif ($req eq 'confirm') {
    my %cookies = CGI::Cookie->fetch;
    my $key = $cookies{ASC5ENA_Session};
    if ( $key ) {
      my $Session_Key = $key->value;
      my $ConfKey = $cgi->param('key');
      my ($UserID) = $dbh->selectrow_array(
        'SELECT UserID from Confirmation WHERE ConfKey = ?',
        {}, $ConfKey);
      if ($UserID) {
        $dbh->do("UPDATE User SET Confirmed = 1 WHERE UserID = ?",
          {}, $UserID);
        $dbh->do("DELETE FROM Confirmation WHERE ConfKey = ?",
          {}, $ConfKey);
        print $cgi->redirect($html . "/resetpw.html");
        return;
      } else {
	print $cgi->redirect($html . "/badkey.html");
	return;
      }
    } else {
      print $cgi->redirect($html . "/fail.html");
      return;
    }
  } elsif ($req eq 'create_flight') {
    my %cookies = CGI::Cookie->fetch;
    my $key = $cookies{ASC5ENA_Session};
    if ( $key ) {
      my $Session_Key = $key->value;
      my ($UserID) = $dbh->selectrow_array(
        'SELECT UserID FROM Session WHERE Session_Key = ?',
        {}, $Session_Key);
      if ($UserID) {
        my $model = $cgi->param('model') || 'unspecified';
        my $level = $cgi->param('level') || 60;
        my $start = $cgi->param('start') || '0000-00-00 00:00:00';
        $dbh->do(
          'INSERT INTO Flight (UserID, Model, Level, StartDate, Comments)
           VALUES (?,?,?,?,?)', {},
           $UserID, $model, $level, $start, '');
        my $FlightID = $dbh->{mysql_insertid};
        $rv{FlightID} = $FlightID;
        $status = "Success: New flight created";
      } else {
        $status = "Failure: Unable to determine user";
      }
    }
  } elsif ($req eq 'record_step') {
    my %cookies = CGI::Cookie->fetch;
    my $key = $cookies{ASC5ENA_Session};
    if ( $key ) {
      my $Session_Key = $key->value;
      my @params = qw(FlightID armtime Latitude Longitude Thrust Orientation);
      my %p = map { ( $_ => $cgi->param($_) || '' ) } @params;
      my ($Suid,$Fuid) = $dbh->selectrow_array(
        'SELECT Session.UserID AS A, Flight.UserID
         FROM Session, Flight
         WHERE Session_Key = ? AND FlightID = ?',
        {}, $Session_Key, $p{FlightID});
      if ($Suid && $Fuid && $Suid == $Fuid) {
        $dbh->do(
          'INSERT INTO Trajectory (' .
           join(', ', @params) .
           ') VALUES (' .
           join(', ', map '?', @params) .
           ')', {}, map( $p{$_}, @params));
        $status = "Success: Point recorded";
      }
    }
  }
  print $cgi->header(%header);

  print "{\n  \"status\": \"", $status, '"',
    map( ",\n  \"$_\": \"" . $rv{$_} . '"', keys %rv),
    "\n}\n";
}
