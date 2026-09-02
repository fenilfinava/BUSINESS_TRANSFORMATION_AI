from typing import Dict, Any

MOCK_DATABASE_ERD = """erDiagram
    ORGANIZATION ||--o{ WORKSPACE : has
    WORKSPACE ||--o{ PROJECT : contains
    PROJECT ||--o{ BLUEPRINT : generates
    
    ORGANIZATION {
        uuid id PK
        string name
        string industry
        timestamp created_at
    }
    
    WORKSPACE {
        uuid id PK
        uuid organization_id FK
        string name
        timestamp created_at
    }
    
    PROJECT {
        uuid id PK
        uuid workspace_id FK
        string name
        string status
        string industry
        int team_size
        timestamp created_at
    }
    
    BLUEPRINT {
        uuid id PK
        uuid project_id FK
        string module_name
        jsonb data
        timestamp created_at
    }
"""

MOCK_BPMN_WORKFLOW = """graph TD
    %% BPMN Swimlane Diagram for Claims Processing
    
    subgraph Customer
        A[Submit Claim] --> B[Upload Documents]
    end
    
    subgraph AI_Gateway
        B --> C{Doc Valid?}
        C -- No --> D[Request Re-upload]
        D --> B
        C -- Yes --> E[Extract Text via OCR/LLM]
    end
    
    subgraph Core_System
        E --> F[Check Policy Coverage]
        F --> G{Coverage Valid?}
        G -- No --> H[Reject Claim]
        G -- Yes --> I[Estimate Payout]
    end
    
    subgraph Adjuster
        I --> J{Requires Manual Review?}
        J -- Yes --> K[Human Adjuster Review]
        K --> L[Approve/Reject]
        J -- No --> L
    end
    
    subgraph Finance
        L --> M[Process Payment]
        M --> N[Notify Customer]
    end
"""

MOCK_ARCHITECTURE_HLD = """graph TB
    %% High-Level Architecture
    
    Client[Web/Mobile Client] --> API_GW[API Gateway / Load Balancer]
    
    subgraph AWS_Cloud[AWS Cloud Architecture]
        API_GW --> Auth[Cognito Auth]
        API_GW --> Microservices[EKS Kubernetes Cluster]
        
        subgraph Microservices
            S1[Claims Service]
            S2[User Service]
            S3[Notification Service]
        end
        
        S1 --> EventBus[Kafka / EventBridge]
        S2 --> EventBus
        
        S1 --> DB1[(Aurora PostgreSQL)]
        S2 --> DB2[(DynamoDB)]
    end
    
    EventBus --> DataLake[S3 Data Lake]
    EventBus --> Analytics[Redshift]
"""

MOCK_ROADMAP_MD = """# Transformation Roadmap: ERP Cloud Migration

## Phase 1: Assessment & Planning (Months 1-2)
- **Infrastructure Audit:** Comprehensive review of existing on-premise servers and legacy ERP modules.
- **Dependency Mapping:** Map all internal/external API integrations.
- **Security Review:** Establish target zero-trust architecture guidelines.
- **Deliverable:** Detailed Cloud Migration Strategy Document.

## Phase 2: Foundation & Proof of Concept (Months 3-4)
- **Landing Zone Setup:** Provision AWS Accounts, VPCs, Subnets, and IAM roles.
- **Database Migration POC:** Test migration of subset of data to Amazon Aurora.
- **Containerization:** Dockerize the core microservices.
- **Deliverable:** Operational CI/CD pipeline and AWS Landing Zone.

## Phase 3: Core Migration (Months 5-8)
- **Data Migration:** Execute full cutover using AWS DMS (Database Migration Service).
- **Service Deployment:** Deploy core business logic to Amazon EKS.
- **Integration Testing:** End-to-end testing with 3rd party logistics and payment gateways.
- **Deliverable:** Staging environment fully operational.

## Phase 4: Go-Live & Optimization (Months 9-10)
- **User Acceptance Testing (UAT):** Business stakeholders sign off on new system.
- **Production Cutover:** Blue/Green deployment to minimize downtime.
- **Post-Go-Live Support:** Hypercare period for 4 weeks.
- **Deliverable:** Live system with performance monitoring dashboards.
"""

MOCK_WIREFRAME_JSON = {
    "screens": [
        {
            "name": "Dashboard",
            "layout": "sidebar-main",
            "components": [
                {"type": "header", "content": "Welcome back, User"},
                {"type": "kpi_cards", "metrics": ["Total Claims", "Pending Review", "Approved Amount"]},
                {"type": "data_table", "columns": ["Claim ID", "Date", "Status", "Action"]}
            ]
        },
        {
            "name": "Claim Detail",
            "layout": "split-pane",
            "components": [
                {"type": "document_viewer", "position": "left"},
                {"type": "form_fields", "position": "right", "fields": ["Policy Info", "Extracted Data", "Approval Actions"]}
            ]
        }
    ]
}

MOCK_EFFORT_ESTIMATES = """| Phase | Activity | Role | Estimated Hours | Complexity |
|---|---|---|---|---|
| Phase 1 | Infra Audit | Cloud Architect | 80 | Medium |
| Phase 1 | Security Review | Security Engineer | 40 | High |
| Phase 2 | Landing Zone | DevOps Engineer | 120 | High |
| Phase 2 | DB POC | Data Engineer | 80 | Medium |
| Phase 3 | App Migration | Backend Engineer | 320 | High |
| Phase 3 | UI Integration | Frontend Engineer | 160 | Medium |
| Phase 4 | UAT & Cutover | Project Manager | 80 | Low |

**Total Estimated Hours:** 880 hours
**Estimated Timeline:** 6-8 months
"""

MOCK_DASHBOARD_METRICS = {
    "ai_readiness_score": 78,
    "cloud_maturity_score": 45,
    "risk_level": "Medium",
    "estimated_roi_months": 14
}

def get_mock_data_for_module(module_name: str) -> Dict[str, Any]:
    if module_name == "Solution Architecture Builder":
        return {"format": "mermaid", "content": MOCK_ARCHITECTURE_HLD}
    elif module_name == "Process Intelligence Designer":
        return {"format": "mermaid", "content": MOCK_BPMN_WORKFLOW}
    elif module_name == "Database & Integration Designer":
        return {"format": "mermaid", "content": MOCK_DATABASE_ERD}
    elif module_name == "AI UX Designer":
        return {"format": "json", "content": MOCK_WIREFRAME_JSON}
    elif module_name == "Transformation Planner":
        return {"format": "markdown", "content": MOCK_ROADMAP_MD}
    elif module_name == "AI Planning Engine":
        return {"format": "markdown", "content": MOCK_EFFORT_ESTIMATES}
    elif module_name == "Transformation Dashboard":
        return {"format": "json", "content": MOCK_DASHBOARD_METRICS}
    else:
        return {"format": "markdown", "content": f"Analysis complete for {module_name}."}
