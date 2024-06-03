packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "AWS_ACCESS_KEY_ID" {
  type = string
  default = ""
}
variable "AWS_SECRET_ACCESS_KEY" {
  type = string
  default = ""
}

source "amazon-ebs" "custom-ami" {

  ami_name      = "MyNode-Ami-A10"
  instance_type = "t2.micro"
  region        = "us-east-1"
  source_ami    = "ami-033b95fb8079dc481"
  ssh_username  = "ec2-user"
  ami_users     = ["960807583305"]
  access_key    = "${var.AWS_ACCESS_KEY_ID}"
  secret_key    = "${var.AWS_SECRET_ACCESS_KEY}"
}

build {
  name = "custom-ami-builder"
  sources = [
    "source.amazon-ebs.custom-ami"
  ]

  provisioner "file" {
    source = "webservice.zip"
    destination = "~/"
  }

  provisioner "shell" {
      inline =  [
      "cd ~",
      "sudo mkdir -p webservice",
      "sudo chmod 755 webservice",
      "sudo unzip webservice.zip -d ~/webservice"
      ]
  }

  provisioner "shell" {
    scripts = [
      "installer.sh"
    ]
  }
}