package ModelDefs;

use Exporter 'import';
@EXPORT_OK = qw( %models ); 

%models = ( 
"era-interim" => { full_name => "ECMWF Interim Reanalysis", 
    time_range => [ 730852.00, 735234.75 ], time_step => 0.25,
    path => "/storage/nas-0-2/Stratosphere/Data/UTLS_winds/era-interim" }, 
"merra" => { full_name => "Modern Era Reanalysis for Research and Applications", 
    time_range => [ 730852.000, 735234.875 ], time_step => 0.125,
    path => "/storage/nas-0-2/Stratosphere/Data/UTLS_winds/merra" }
); 


1;

