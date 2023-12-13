# **Times series management**
The management of time series is done in the time series applet.

#### Table of contents
1. [Introduction](#basic) 
2. [View time series](#view)
3. [Data formats](#data)
    1. [csv format - pivotised](#csv_1)
    2. [csv format - bulk](#csv_2)

## **Introduction** <a name="basic" style="padding-top: 50px"></a>
What is special about financial time series is that there are not only scalar time series like stock or fx quotes, but also curves and surfaces that have multiple support points. The JSON risk time series applet allows storing and querying time series by name and tag. 

 - The name of a time series can only contain uppercase and lowercase letters, numbers, hyphens, underscores, as well as the plus sign. The name cannot be "NAME".
 - A tag is an arbitrary string, but is typically chosen to represent a support point (like '1D', '1M', '1Y').

For each time series and every support point, the applet also allows storing a description and arbitrary JSON metadata like conventions.

## **View time series** <a name="view" style="padding-top: 50px"></a>

#### View time series definitions

Clicking the button **`Overview`** shows all stored time series with their support points and metadata.

#### View single time series by tags

The applet supports viewing and downloading a single time series (e.g., one curve with multiple support points) in a pivotised way, that is, each line corresponds to a date, and each column correponds to a tag. The applet shows support points in a properly ordered way, i.e., "5D" before "1W", "6W" before "2M", "360D" or "11M" before "1Y" etc.
  
Click **`Data`** on the left panel. On the main panel, choose a time series from the drop down box **`Name`**.
 - You can restrict the time range by entering dates in YYYY-MM-DD format into the **`From`** and **`To`** fields.
 - With the **`Interpolaton`** flag you can choose if you require the applet to interpolate and extrapolate missing data. Interpolation is always done linearly on the time axis.

## Data import and export <a name="formats" style="padding-top: 50px"></a>
The applet supports two data formats. Both data formats have the following specification in common:

 - Lines are separated by Linux or Windows line endings. The export always uses Linux line endings.
 - Fields are separated by the semicolon `;`character
 - Dates are in YYYY-MM-DD format
 - Numbers must not have thousands separators. Decimals like `0.0043` or scientific numbers like `0.43E-2` or `0.43e-2` are supported. Decimal separator can be period `.` or comma `,` which makes import from excel more independend from regional settings.

#### Pivotised format <a name="csv_1" style="padding-top: 50px"></a>

The pivotised format supports only one timeseries (with multiple support points) at a time and does not support metadata. The time series must exist in the database already. It is meant as a convenient way to import data from spreadsheets and export data to spreadsheets.

The first field in the first line contains the name of the time series. The other fields in the first line contain the tags. The other lines contain the date in the first field and the numbers in the other fields. Here is an example:

```
	EXAMPLE;1D;30D;90D;180D;1Y;2Y;5Y;10Y;20Y;30Y
	1994-08-02;-0.00457;-0.00458;-0.00463;-0.00475;-0.00497;-0.00512;-0.00458;-0.00222;0.00176;0.00225
	1994-08-03;-0.00457;-0.00458;-0.00463;-0.00475;-0.00497;-0.00512;-0.00458;-0.00222;0.00176;0.00225
```

You can export pivotised data in the **`Data`** section on the left panel as shown above. You can import pivotised data in the **`Import`** section on the left panel. Here, the applet detects the format automatically by examining the first field in the first line.

#### Bulk import-export format <a name="csv_2" style="padding-top: 50px"></a>

The bulk format is used to

 - make a complete export of all timeseries at once
 - import one or multiple time series at once, while a description and JSON metadata is supported. As oppposed to the pivotised import, the time series does not have to exist in the database before. So this format is used to initially store a time series.

The format has the fields:

 - NAME: This must be the first field and contains the name of the time series. The order of the other fields is arbitrary
 - TAG: Mandatory. Contains the tag of the sub time series.
 - DATE: Optional. Contains the date string. If DATE and VALUE are present in one line and contain valid data, the value is updated for the respective date.
 - VALUE: Optional. Contains the value for the date given. If DATE and VALUE are present in one line and contain valid data, the value is updated for the respective date.
 - DESC: Optional. Contains a descriptive string. If it is empty, the description is not updated during import-
 - META: Optional. Contains a JSON string that may contain more descriptive data. If it is empty, the description is not updated during import.

Here is an example. Since empty description and meta fields are ignored, it is enough to populate those fields in only on line per tag in order to update description and meta.

```
	NAME;TAG;DATE;VALUE;DESC;META
	EXAMPLE;1D;2020-01-01;0.0001;Example Description 1;{"convention": "Act/360"}
    EXAMPLE;1D;2020-01-02;0.0001;;
    EXAMPLE;1D;2020-01-03;0.0001;;
    EXAMPLE;1D;2020-01-04;0.0001;;
	EXAMPLE;2D;2020-01-01;0.0002;Example Description 2;{"convention": "Act/365"}
    EXAMPLE;2D;2020-01-03;0.0002;;
    EXAMPLE;2D;2020-01-04;0.0002;;
```

You can export all data in the **`Data`** section on the left panel by clicking the **`Export all`** button. You can import bulk data in the **`Import`** section on the left panel. Here, the applet detects the format automatically by examining the first field in the first line.

