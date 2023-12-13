# User management

## Introduction
User and access management in the JSON risk app is straightforward due to the simple access rights concept. The permissions of a user are defined by the access rights below:

  - `u` - manage users (admin permission)
  - `r` - read data
  - `w` - write data
  - `x` - execute jobs

## Adding an admin user on the command line
Setting up users requires a user with the `u` permission. A new instance of the JSON risk app has no users. Therefore, you need to set up at least one user on the command line. That is what the `jr_user_add` command is for. The command `./jr_user_add INSTANCE USER` adds a new user with name `USER` and permission `u` in the instance `INSTANCE`. If the instance does not exist, it is created.

The `jr_user_add` command asks for a password. Your input is subject to the naming conventions below:

 - A username can only contain letters, numbers, hyphens and underscores.
 - An instance can only contain letters, numbers, hyphens and underscores.
 - A password cannot contain whitespace.

## Manage users
An admin user (i.e., one with the `u` permission) can manage all user accounts in the user management applet by clicking `Accounts`. The applet supports a list of actions:

 - Add a new user: Clicking the button `Add User` opens a dialog with the fields name, email and permissions. An E-Mail address is needed for passwordless login. Clicking `Save` stores the new user. The button `Cancel` closes the dialog without any changes. A newly added user does not have a password. In order to add a user with a password, use the `jr_user_add` command and subsequently change permissions and set an E-Mail address in the user interface.
 - Edit an existing user: Clicking the button `Edit` for an existing user in the list opens a dialog with the fields name, email and permissions. An E-Mail address is needed for passwordless login. Clicking `Save` stores the modified user. The button `Cancel` closes the dialog without any changes.
 - Lock and unlock users: Click `Lock` on an unlocked user or `Unlock` on a locked user.

## Password reset
Each user can change his own password in the user management applet by clicking `Update password`. In the dialog that opens, users can supply a new password.

## E-Mail setup for passwordless login
For passwordless login, a valid E-Mail configuration (SMTP credentials) has to be setup in the file `.security.json` in the installation directory.	Here is an example of a valid JSON file.

```
{
	"mail": {
		"host": "mail.example.net",
		"port": 587,
		"username": "example",
		"password": "secret",
		"external_host": "https://jsonrisk.example.net"
	}
}
```
 
If a user has been stored with a valid E-Mail address, the user can login passwordless by just entering instance name and user name into the login prompt and leaving the password field empty. That works even if the user does not have a password set. Once a user is logged in, the user can also set a password.


