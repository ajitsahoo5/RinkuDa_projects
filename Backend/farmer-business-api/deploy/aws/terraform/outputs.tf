output "api_url" {
  description = "Public API base URL (append paths like /registry/farmers)"
  value       = "http://${aws_lb.main.dns_name}/${local.api_prefix}"
}

output "health_url" {
  value = "http://${aws_lb.main.dns_name}/${local.api_prefix}/health"
}

output "swagger_url" {
  value = "http://${aws_lb.main.dns_name}/${local.api_prefix}/docs"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "rds_endpoint" {
  description = "RDS hostname (for pg_dump/restore from a bastion or VPN)"
  value       = aws_db_instance.main.address
}

output "rds_database_name" {
  value = var.db_name
}

output "db_username" {
  value = var.db_username
}

output "secrets_manager_arn" {
  value = aws_secretsmanager_secret.app.arn
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.api.name
}

output "next_steps" {
  value = <<-EOT
    1. Build and push Docker image to ECR (see deploy/aws/DEPLOY-AWS.md)
    2. Force new ECS deployment after push
    3. Restore local PostgreSQL data to RDS if migrating
    4. Set admin-dashboard VITE_API_BASE_URL to: http://${aws_lb.main.dns_name}/${local.api_prefix}
  EOT
}
