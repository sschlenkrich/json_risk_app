<?PHP

/*

Copyright (c) 2018 Dr. Tilman Wolff-Siemssen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

$ndates=count($dates);
for($itag=0;$itag<count($results[0]);$itag++){
	// extrapolate beginning
	$idate=0;
	$val=$results[$idate][$itag];
	while(null==$results[$idate][$itag] && $idate<$ndates){
		$idate++;
	}
	$val=$results[$idate][$itag];
	$idate--;
	while($idate>=0){
		$results[$idate][$itag]=$val;
		$idate--;
	}
	
	// extrapolate end
	$idate=$ndates-1;
	while(null==$results[$idate][$itag] && $idate>=0){
		$idate--;
	}
	$val=$results[$idate][$itag];
	$idate++;
	while($idate<$ndates){
		$results[$idate][$itag]=$val;
		$idate++;
	}

	//interpolate middle
	$ilast=0;
	$vlast=$results[$ilast][$itag];
	$inext=1;
	for($idate=1;$idate<$ndates-1;$idate++){
		$inext=max($idate+1,$inext);
		if (null==$results[$idate][$itag]) {
			while(null==$results[$inext][$itag]) $inext++;
			$vnext=$results[$inext][$itag];
			$results[$idate][$itag]=($vlast*($inext-$idate)+$vnext*($idate-$ilast))/($inext-$ilast);
		} else {
			$ilast=$idate;
			$vlast=$results[$ilast][$itag];
		}
	}
}
