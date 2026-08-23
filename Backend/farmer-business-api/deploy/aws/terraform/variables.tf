variable "aws_region" {
  description = "AWS region (ap-south-1 = Mumbai)"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment label (prod, staging)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Resource name prefix"
  type        = string
  default     = "farmer-registry"
}

variable "db_name" {
  type    = string
  default = "rinku_pacs"
}

variable "db_username" {
  type    = string
  default = "registry_admin"
}

variable "db_instance_class" {
  description = "RDS instance size (db.t4g.micro is cost-effective)"
  type        = string
  default     = "db.t4g.micro"
}

variable "cors_origins" {
  description = "Comma-separated admin app origins allowed by CORS"
  type        = string
  default     = "https://your-admin-domain.com"
}

variable "firebase_project_id" {
  type    = string
  default = "farmer-management-a5b32"
}

variable "firebase_client_email" {
  description = "Firebase service account client_email"
  type        = string
  sensitive   = true
}

variable "firebase_private_key" {
  description = "Firebase service account private_key (use \\n for newlines in tfvars)"
  type        = string
  sensitive   = true
}

variable "enable_nat_gateway" {
  description = "Use private subnets + NAT (~$32/mo). If false, ECS uses public subnets (budget mode)."
  type        = bool
  default     = false
}

variable "container_cpu" {
  type    = number
  default = 256
}

variable "container_memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "db_migration_cidr" {
  description = "Optional: your public IP/32 for temporary pg_restore during migration (remove after import)"
  type        = string
  default     = ""
}
