# Persona: Data Scientist

## Stack & tooling
- Languages: Python, SQL; R for some analyses
- Analysis & ML: pandas, NumPy, scikit-learn, statsmodels, XGBoost/LightGBM
- Notebooks & envs: Jupyter/JupyterLab, conda/poetry, Vertex AI Workbench / SageMaker notebooks
- Experimentation: MLflow / Weights & Biases, feature store, experiment tracking
- Viz & reporting: matplotlib/seaborn/plotly, dashboards (Looker/Streamlit)

## Key systems to access first
1. Data warehouse + read access to analytics datasets (least-privilege grants)
2. Notebook / compute environment (Vertex AI Workbench / SageMaker / managed JupyterHub)
3. Feature store and experiment-tracking server (MLflow/W&B)
4. Data catalog / lineage tool and PII/compliance policies
5. Model registry and access to training data buckets (GCS/S3)

## Role-specific onboarding tasks
- Get warehouse read access + spin up a notebook environment (setup, 1d)
- Reproduce an existing analysis/notebook end-to-end (learning, 1-2d)
- Pull a dataset, run EDA, and log an experiment to the tracking server (systems, 1-2d)
- Train a baseline model and register it in the model registry (projects, 2d)
- Review data governance, PII handling, and experiment-reproducibility standards (culture, 1d)

## Recommended resources (ranked)
1. Data platform + feature store / catalog overview (docs, 10)
2. Experiment-tracking & reproducibility conventions (docs, 9)
3. Model registry + handoff-to-engineering workflow (guide, 8)
4. Data governance & PII policy (docs, 8)

## People to meet
- Lead data scientist / ML lead (mentor archetype)
- Data engineer who owns the datasets/feature store they'll use
- Data governance / compliance owner
- Product/business stakeholder for the modeling problem

## First-week goals & success metrics
- Runs a notebook against real data and logs an experiment unaided
- Reproduces one existing analysis and understands its data sources
- Trains and registers one baseline model

## Ramp-time modifiers
Compute/notebook provisioning and PII approvals often add ~2 days; reproducing existing analyses
can be slow without good docs — extend the base timeline accordingly (junior 14d → ~16d).
