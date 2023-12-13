# API Documentation

## General

The application features a straightforward API for many functional purposes. When making requests against the API, users need to authenticate. To that end, a valid token is obtained on the endpoint api/token. Here is an example how that is done with curl:

```

curl -X POST -d 'ins=<instance>' -d 'sub=<username>' -d 'pwd=<password>' http://127.0.0.1:8080/api/user/token

```

API users then extract the token `<TOKEN>` from the response. All further requests need to have an authorization token attached, as the example below illustrates:

```

curl -X GET -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8080/api/portfolios
curl -X POST -H "Authorization: Bearer <TOKEN>" -d '@file=<dateiname.json>' -d 'name=NAME'  http://127.0.0.1:8080/api/params

```

For access to the API from the local system, a command line tool `jr_client` is included. It takes an instance name and an API endpoint as first two arguments. It then generates a token for the specified instance and executes curl against the hostname and port configured in the `.config` file. The third and all other arguments are passed to curl. The examples above turns into

```

./jr_client <instance> api/portfolios
./jr_client -X POST api/params -d '@file=<dateiname.json>' -d 'name=NAME'

```

and no separate request to the api/user/token endpoint is needed.

Below, we describe the API endpoints for different purposes.

## User


| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/user/token         | GET |Returns a token by setting an HTTP-only cookie| None |Request needs HTTP Authorization header or a Cookie header with the value `access_token` populated with a valid token.
| api/user/token         | POST |Returns a token by setting an HTTP-only cookie `access_token`| sub and pwd fields, encoded as multipart/form-data|
| api/user/token/{LOGIN TOKEN}         | GET |Returns a token by setting an HTTP-only cookie|None |Passwordless login: URL needs a valid `<LOGIN TOKEN>` that was sent by E-Mail before.
| api/user/password      | POST|Updates the user's password |pwd and pwd1 fields, encoded as multipart/form-data|Request needs HTTP Authorization header or a Cookie header with the value `access_token` populated with a valid token.
| api/user/logout      | GET|Deletes the HTTP-only cookie `access_token`|None||
| api/user/mgmt      | GET|Returns a list of all users with their permissions and lock status| None|Request must contain a token with the `u` permission set.
| api/user/mgmt      | POST|Updates info for a single user|A JSON object with the fields `sub` (the name of the user), `per` (the permission string), `ema` (the E-Mail address), and `locked` (the lock status of the user) set.|Request must contain a token with the `u` permission set.

## Params

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/params | GET |Returns a JSON list of parameters sets available| None |Must have read permissions
| api/params/{PARAM FILE}  | GET |Returns the param file in JSON format. Param file name consists of a date string YYYY-MM-DD, an underscore and a name that can contain letters, numbers, hyphens and underscores.| None|Must have read permissions
| api/params | POST |Stores the parameter set uploaded| Data is multipart/form-data encoded. Fields: `file` (a JSON file), `name` (the name component of the params set, without date and .json extension), `temp` a boolean variable indicating if temp store is requested |Must have write permissions. The JSON submitted in the `file` field must contain the valuation_date property. Then, the file is stored under the valuation_date submitted. If `temp` is true, no file name is needed and the file is stored under a server-generated name which is returned in the JSON response.

## Portfolio

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/portfolio | GET |Returns a JSON list of dates for which portfolios are available| None |Must have read permissions
| api/portfolio/{yyyy-mm-dd} | GET |Returns a JSON list of portfolios available for date yyyy-mm-dd| None |Must have read permissions
| api/portfolio/all | GET |Returns a JSON list of portfolios available for all dates| None |Must have read permissions
| api/portfolio/{yyyy-mm-dd}/{name} | GET |Returns the requested portfolio.| None |Must have read permissions
| api/portfolio/{yyyy-mm-dd}/{name} | POST |Stores the requested portfolio.| The portfolio as a gzipped JSON file |Must have write permissions. Portfolio name must consist of only letters, numbers, hyphens and underscores.

## Scenarios

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/scenarios | GET |Returns a JSON list of scenario groups available| None |Must have read permissions
| api/scenarios/{name} | GET |Returns the scenario group {name} in JSON format| None |Must have read permissions
| api/scenarios/{name} | POST |Stores the uploaded JSON scenario group| Data is multipart/form-data encoded. Fields: `file` (a JSON file), `name` (the name of the scenario group, without .json extension) |Must have write permissions

## Time Series

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/series/data | GET |Returns a bulk export of all time series in CSV format | None |Must have read permissions
| api/series/data | POST |Update time series in CSV format | CSV data, see documentation for the [Time Series applet ](/docs/Time_Series.md) for format specifications. |Must have write permissions
| api/series/data/{name} | GET |Returns a bulk export of all tags of the time series with name {name} in CSV format | None | Name consists of letters, numbers, hyphens, underscores and plus signs and cannot be *NAME*. Must have read permissions
| api/series/data/{name} | DELETE |Delete time series with name {name}, all tags | None |Name consists of letters, numbers, hyphens, underscores and plus signs and cannot be *NAME*. Must have write permissions
| api/series/data/{name}/{tag} | DELETE |Delete time series with name {name} and tag {tag} | None |Name and tag consist of letters, numbers, hyphens, underscores and plus signs and name cannot be *NAME*. Must have write permissions
| api/series/definitions | GET |Returns the time series definitions in JSON format | None |Must have read permissions
| api/series/definitions/{name}| GET |Returns the time series definitions of all tags corresponding to {name} in JSON format | None |Name consists of letters, numbers, hyphens, underscores and plus signs and cannot be *NAME* Must have read permissions
| api/series/names | GET |Returns the names of all time series definitions in JSON format | None |Must have read permissions
| api/series/table/{name} | GET |Returns a pivotised table of time series data for all tags of the time series with name {name}|None |Supports the query parameters *from* (YYYY-MM-DD), *to* (YYYY-MM-DD), *interpolate* ("true" or not "true"). Name consists of letters, numbers, hyphens, underscores and plus signs and cannot be *NAME*. Must have read permissions

## Modules

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/modules | GET |Returns a list of modules in JSON format | None |Must have read permissions
| api/modules/{name} | GET |Returns the module {name} if it exists | None |Name is without the '.js' extension. Serves modules with the Content-Type HTTP header set to *text/javascript*. Must have read permissions

## Runs

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/runs | GET |Returns a JSON object with all run specifications and run executions in JSON format. | None |Must have read permissions
| api/runs/{exec}/run.log | GET |Returns the log file corresponding to the execution with execution id {exec}. | None |Must have read permissions
| api/runs/{exec}/run.json | GET |Returns the run specification info corresponding to the execution with execution id {exec}. | None |Must have read permissions
| api/runs/{name} | DELETE |Deletes the run specification with name {name}. | None |Must have write permissions
| api/runs/{name} | POST |Creates or updates the run specification with name {name}. Depending on the payload, also execute the run. | JSON run specification. Run is executed if run specification contains *execute* field with true boolean value. |Must have write permissions. Must have execute permissions if execution is requested.


## Results

| Endpoint      | Method | Description| Request Payload|Comment
| ----------- | ----------- | --------|--------|--------|
| api/results | GET |Returns a JSON list of dates for which results are available| None |Must have read permissions
| api/results/{yyyy-mm-dd} | GET |Returns a JSON list of result sets available for date yyyy-mm-dd| None |Must have read permissions
| api/results/all | GET |Returns a JSON list of result sets available for all dates| None |Must have read permissions
| api/results/{yyyy-mm-dd}/{name} | GET |Returns the contents of the results set stored under date yyyy-mm-dd and name {name}. Contents are aggregated by the standard aggretation level *sub_portfolio*.| None |Must have read permissions
| api/results/{yyyy-mm-dd}/{name} | POST |Returns the aggregated contents of the results set stored under date yyyy-mm-dd and name {name}. An aggregation specification is accepted as payload.| A JSON object where the *grouping* property is an array of strings. These strings specify by what grouping results should be aggregated.|Must have read permissions


