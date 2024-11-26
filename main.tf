
resource "aws_key_pair" "ultimatesecret_key" {
  key_name   = "ultimatesecret"
  public_key = file("./secrets/ultimatesecret.pem.pub")
}

resource "aws_security_group" "web_sg" {
  name        = "allow_ssh_http"
  description = "Permitir acceso SSH y HTTP"
  vpc_id      = "vpc-06bd5560550f47fc5"  

  ingress {
    description = "Allow SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_instance" "web" {
  ami           = "ami-085f9c64a9b75eed5"  
  instance_type = "t2.micro"
  key_name      = aws_key_pair.ultimatesecret_key.key_name

  subnet_id = "subnet-043027d3eb3b979a0"
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  tags = {
    Name = "Terraform-WebServer"
  }

  user_data = <<-EOF
    #!/bin/bash
    sudo yum update -y
    sudo yum install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
  EOF
}
