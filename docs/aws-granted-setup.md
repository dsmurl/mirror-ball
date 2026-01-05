Back to [root README](../README.md)

# AWS Access with Granted

[Granted](https://granted.dev/) is a CLI tool that makes it easy to access multiple AWS accounts and roles. It is highly recommended for local development with Pulumi.

## 1. Install Granted

Follow the [official installation guide](https://www.granted.dev/docs/getting-started#installing-the-cli).

For macOS (Homebrew):

```bash
brew install common-fate/granted/granted
```

Or be a bad ass and use `asdf` like me

```
  ## Granted

  - `asdf plugin add granted https://github.com/dex4er/asdf-granted.git`
  - `asdf install granted 0.38.0`
  - `asdf set granted 0.38.0 --home`
```

## 2. Configure `.aws/config`

You need to configure your `~/.aws/config` file to include profiles for the roles created in the [Infra Setup](./infra-setup.md).

Since these roles are designed for GitHub OIDC, they don't have direct "user" credentials. For local use, you typically assume these roles from a base identity (like an IAM User or an AWS SSO login).

Add the following to your `~/.aws/config`:

```ini
  [profile mirror-ball-base]
  region = us-west-2
  # If using SSO:
  # sso_start_url = https://your-org.awsapps.com/start
  # sso_region = us-west-2
  # sso_account_id = <ACCOUNT_ID>
  # sso_role_name = AWSAdministratorAccess

  [profile mirror-ball-creator]
  role_arn = arn:aws:iam::<ACCOUNT_ID>:role/mirror-ball-creator
  source_profile = mirror-ball-base
  region = us-west-2
```

Replace `<ACCOUNT_ID>` with your actual AWS Account ID.

## 3. Using Granted with Pulumi

Instead of using `aws configure` to set static credentials, use Granted to assume the role:

```bash
  # Assume the creator role
  assume mirror-ball-creator

  # Now you can run Pulumi commands
  cd apps/infra
  pulumi up
```

Granted will open a browser window (if using SSO) or use your base profile to assume the role and export temporary credentials into your current shell session.

### Tips

- Use `assume --unassume` to clear credentials.
- You can also run commands directly: `granted exec --profile mirror-ball-creator -- pulumi up`.
