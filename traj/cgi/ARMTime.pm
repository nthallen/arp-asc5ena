package ARMTime; 

#  There are two subroutines: ConvertFrom and ConvertTo. The first 
#  converts an ARMTime into a date: year, month, day, hour, minute, second. 
#  the second converts from a date to an ARMTime. 

#  The month is always [1,12], the day [1,31]. Currently functional 
#  beginning in $ARMbasisyear. 

$ARMbasisyear = 1946; 
$ARMbasisoffset = 710763; 



sub ConvertFrom {

#  Convert the ARM time format to year/month/day/hour/minute/second. 
#  The result is returned as an array. The ARM time format is the 
#  number of days (floating point) since midnight 1 Jan 0000. 

#  The month is [1,12]. 
#  The day is [1,31]. 

my $armtime = shift; 

#  Allow for a 0.01 second roundoff error in $armtime. 

my $roundoff = 0.01 / 86400; 

my $res = $armtime - $ARMbasisoffset + $roundoff; 
my $year = $ARMbasisyear; 
my $month = 0; 
my $day = 0; 

#  Figure out which year we are in. We have already assumed that we 
#  are post- 2000. 

for ( $year = $ARMbasisyear; ($n = ndays( $year )) < $res; $year++ ) {
  $res -= $n; 
}; 

#  Figure out which month we are in. 

if ( $n == 365 ) {
  @days = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31); 
} else {
  @days = (31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31); 
}; 

for ( $month=0; $res > $days[$month]; $month++ ) { 
  $res -= $days[$month]; 
}; 
$month++; 

#  Figure out which day we are in. 

my $day = int( $res ) + 1; 
$res -= ($day - 1); 

#  Compute hour. 

my $hour = int( 24 * $res ); 
$res -= $hour/24; 

#  Compute minute. 

my $minute = int( 24*60 * $res ); 
$res -= $minute / (24*60); 

#  Compute floating point seconds. 

my $second = 24*60*60 * ( $res - $roundoff );
if ($second<0.0) {$second=0.0}; 

#  Return result as an array. 

return ($year, $month, $day, $hour, $minute, $second); 

}; 


sub ConvertTo {

#  This subroutine converts from year, month, day, hour, minute, second to 
#  an ARMTime. Be certain that the day ranges from 1 to 31, the month from 
#  1 to 12. 

($year, $month, $day, $hour, $minute, $second) = @_; 

$ARMTime = $ARMbasisoffset; 

for ($i=$ARMbasisyear; $i<$year; $i++) {
  $ARMTime += ndays( $i ); 
}; 

if (ndays($year) == 365) {
  @days = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31); 
} else {
  @days = (31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31); 
}; 

for ($i=0; $i<$month-1; $i++) {
  $ARMTime += $days[$i]; 
}; 

$ARMTime += $day-1 + ($hour + ($minute + $second/60) / 60) / 24; 

return $ARMTime; 

}



sub ndays {

my $year = shift; 

if ( ($year % 400) == 0 ) {
  return 366; 
} elsif ( ($year % 100) == 0 ) {
  return 365; 
} elsif ( ($year % 4) == 0 ) {
  return 366; 
} else {
  return 365; 
}; 

}; 


1; 

