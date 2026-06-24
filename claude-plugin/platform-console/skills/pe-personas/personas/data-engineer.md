# Persona: Data Engineer

## Stack & tooling
- Languages: Python, SQL; Scala/Java for some pipelines
- Processing: Spark, dbt, Airflow/Dagster/Prefect, Kafka/Flink for streaming
- Storage & warehouse: Snowflake/BigQuery/Redshift, data lake (S3/GCS), Delta/Iceberg
- Quality: data tests (dbt tests / Great Expectations), lineage & catalog tooling
- IaC adjacent: Terraform for data infra, orchestration configs

## Key systems to access first
1. Data warehouse + role-based access (least-privilege grants)
2. Orchestrator access (Airflow/Dagster) and the pipeline repo
3. dbt project + warehouse credentials
4. Data catalog / lineage tool and PII/compliance policies
5. Secrets manager and source-system connections

## Role-specific onboarding tasks
- Get warehouse + orchestrator access; run a sample query (setup, 1d)
- Clone the pipeline/dbt repo and run a model build locally (systems, 1-2d)
- Trace one pipeline end-to-end (source → warehouse → mart) (learning, 1-2d)
- Add a small dbt model or test and open a PR (projects, 2d)
- Review data governance, PII handling, and SLAs (culture, 1d)

## Recommended resources (ranked)
1. Data platform architecture + lineage map (docs, 10)
2. dbt project conventions + style guide (docs, 9)
3. Orchestration / pipeline runbook (guide, 8)
4. Data governance & PII policy (docs, 8)

## People to meet
- Data platform / analytics-engineering lead (mentor archetype)
- Data governance / compliance owner
- Key data consumers (analysts / DS) for the domain

## First-week goals & success metrics
- Queries the warehouse and runs a dbt build unaided
- Understands one pipeline end-to-end and its data contracts
- Ships one model/test PR

## Ramp-time modifiers
Access provisioning (warehouse roles, PII approvals) often adds ~2 days — extend the base
timeline accordingly (junior 14d → ~16d).
