/**
 * Industry Skills Dataset — T7 Learning Hub
 *
 * Curated branches: CSE, IT, AI/ML, Data Science, Cyber Security,
 * Cloud Computing, Mathematics & Computing, MCA, BCA
 *
 * All roles are PLACEMENT-READY roles for these branches.
 * Skill priorities: high = must-have, medium = important, low = nice-to-have
 */

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY ROLES
// ─────────────────────────────────────────────────────────────────────────────
export const industryRoles = [

  // ═══════════════════════════════════════
  // CSE / IT / MCA / BCA — Core Dev Roles
  // ═══════════════════════════════════════
  {
    id: 'sde-backend',
    role_name: 'Software Development Engineer (SDE) / Backend Developer',
    description: 'Build scalable server-side logic, APIs, and distributed systems',
    required_skills: [
      { name: 'Data Structures & Algorithms', priority: 'high' },
      { name: 'Java', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'SQL', priority: 'high' },
      { name: 'REST APIs', priority: 'high' },
      { name: 'System Design', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'Node.js', priority: 'medium' },
      { name: 'MongoDB', priority: 'medium' },
      { name: 'Docker', priority: 'medium' },
      { name: 'Spring Boot', priority: 'medium' },
      { name: 'Redis', priority: 'low' },
      { name: 'Microservices', priority: 'low' },
      { name: 'AWS/GCP', priority: 'low' },
    ],
    priority_skills: ['Data Structures & Algorithms', 'Java', 'SQL', 'REST APIs', 'System Design', 'Git'],
  },

  {
    id: 'frontend-developer',
    role_name: 'Frontend Developer',
    description: 'Build modern user interfaces and web applications',
    required_skills: [
      { name: 'HTML', priority: 'high' },
      { name: 'CSS', priority: 'high' },
      { name: 'JavaScript', priority: 'high' },
      { name: 'React', priority: 'high' },
      { name: 'TypeScript', priority: 'medium' },
      { name: 'Git', priority: 'high' },
      { name: 'REST APIs', priority: 'medium' },
      { name: 'Responsive Design', priority: 'high' },
      { name: 'Tailwind CSS', priority: 'medium' },
      { name: 'Next.js', priority: 'medium' },
      { name: 'Testing (Jest)', priority: 'low' },
      { name: 'Webpack/Vite', priority: 'low' },
    ],
    priority_skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
  },

  {
    id: 'fullstack-developer',
    role_name: 'Full Stack Developer',
    description: 'Build complete web applications end-to-end',
    required_skills: [
      { name: 'HTML', priority: 'high' },
      { name: 'CSS', priority: 'high' },
      { name: 'JavaScript', priority: 'high' },
      { name: 'React', priority: 'high' },
      { name: 'Node.js', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'MongoDB', priority: 'medium' },
      { name: 'Git', priority: 'high' },
      { name: 'REST APIs', priority: 'high' },
      { name: 'TypeScript', priority: 'medium' },
      { name: 'Docker', priority: 'medium' },
      { name: 'AWS/GCP', priority: 'low' },
    ],
    priority_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs'],
  },

  {
    id: 'mobile-app-developer',
    role_name: 'Mobile App Developer (Android/iOS)',
    description: 'Build native and cross-platform mobile applications',
    required_skills: [
      { name: 'Java', priority: 'high' },
      { name: 'Kotlin', priority: 'high' },
      { name: 'React Native', priority: 'high' },
      { name: 'Flutter', priority: 'medium' },
      { name: 'Android SDK', priority: 'high' },
      { name: 'REST APIs', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'Firebase', priority: 'medium' },
      { name: 'SQLite', priority: 'medium' },
      { name: 'Swift/iOS', priority: 'low' },
      { name: 'UI/UX Design', priority: 'medium' },
      { name: 'App Store Deployment', priority: 'low' },
    ],
    priority_skills: ['Kotlin', 'Java', 'React Native', 'Android SDK', 'REST APIs', 'Git'],
  },

  {
    id: 'devops-engineer',
    role_name: 'DevOps Engineer',
    description: 'Automate deployment pipelines, manage cloud infrastructure, ensure reliability',
    required_skills: [
      { name: 'Linux', priority: 'high' },
      { name: 'Docker', priority: 'high' },
      { name: 'Kubernetes', priority: 'high' },
      { name: 'CI/CD (Jenkins/GitHub Actions)', priority: 'high' },
      { name: 'AWS/GCP/Azure', priority: 'high' },
      { name: 'Terraform', priority: 'medium' },
      { name: 'Bash Scripting', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'Ansible', priority: 'medium' },
      { name: 'Monitoring (Prometheus/Grafana)', priority: 'medium' },
      { name: 'Networking Basics', priority: 'medium' },
      { name: 'Python Scripting', priority: 'low' },
    ],
    priority_skills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS/GCP/Azure', 'Git'],
  },

  {
    id: 'qa-sdet',
    role_name: 'QA / SDET (Software Development Engineer in Test)',
    description: 'Design and automate test frameworks, ensure software quality at scale',
    required_skills: [
      { name: 'Manual Testing', priority: 'high' },
      { name: 'Selenium', priority: 'high' },
      { name: 'Java', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'TestNG/JUnit', priority: 'high' },
      { name: 'API Testing (Postman)', priority: 'high' },
      { name: 'JIRA', priority: 'medium' },
      { name: 'Git', priority: 'medium' },
      { name: 'CI/CD Integration', priority: 'medium' },
      { name: 'Performance Testing (JMeter)', priority: 'low' },
      { name: 'SQL', priority: 'medium' },
    ],
    priority_skills: ['Manual Testing', 'Selenium', 'Java', 'API Testing (Postman)', 'TestNG/JUnit'],
  },

  {
    id: 'systems-engineer',
    role_name: 'Systems Engineer',
    description: 'Design, integrate, and manage complex IT infrastructure and systems',
    required_skills: [
      { name: 'Linux/Unix', priority: 'high' },
      { name: 'Networking (TCP/IP, DNS, DHCP)', priority: 'high' },
      { name: 'System Administration', priority: 'high' },
      { name: 'Python/Bash Scripting', priority: 'high' },
      { name: 'Cloud Platforms (AWS/Azure)', priority: 'medium' },
      { name: 'Docker/Virtualization', priority: 'medium' },
      { name: 'Monitoring Tools', priority: 'medium' },
      { name: 'Active Directory', priority: 'medium' },
      { name: 'SQL', priority: 'medium' },
      { name: 'ITIL Fundamentals', priority: 'low' },
    ],
    priority_skills: ['Linux/Unix', 'Networking', 'System Administration', 'Python/Bash Scripting'],
  },

  // ═══════════════════════════════════════
  // IT Branch Roles
  // ═══════════════════════════════════════
  {
    id: 'software-developer',
    role_name: 'Software Developer',
    description: 'Develop and maintain software applications across platforms',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Java', priority: 'high' },
      { name: 'JavaScript', priority: 'medium' },
      { name: 'SQL', priority: 'high' },
      { name: 'Data Structures & Algorithms', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'REST APIs', priority: 'medium' },
      { name: 'OOP Concepts', priority: 'high' },
      { name: 'Problem Solving', priority: 'high' },
      { name: 'Agile/Scrum', priority: 'low' },
    ],
    priority_skills: ['Python', 'Java', 'SQL', 'Data Structures & Algorithms', 'OOP Concepts', 'Git'],
  },

  {
    id: 'it-support-sysadmin',
    role_name: 'IT Support / Systems Administrator',
    description: 'Maintain IT infrastructure, handle incidents, and support end users',
    required_skills: [
      { name: 'Windows Server Administration', priority: 'high' },
      { name: 'Linux Administration', priority: 'high' },
      { name: 'Networking Basics', priority: 'high' },
      { name: 'Active Directory', priority: 'high' },
      { name: 'Troubleshooting', priority: 'high' },
      { name: 'Help Desk / ITSM Tools', priority: 'medium' },
      { name: 'Backup & Recovery', priority: 'medium' },
      { name: 'Virtualization (VMware/Hyper-V)', priority: 'medium' },
      { name: 'Cloud Basics (Azure/AWS)', priority: 'low' },
      { name: 'Scripting (PowerShell/Bash)', priority: 'medium' },
    ],
    priority_skills: ['Windows Server Administration', 'Linux Administration', 'Networking Basics', 'Active Directory'],
  },

  {
    id: 'network-engineer',
    role_name: 'Network Engineer',
    description: 'Design, implement, and manage enterprise networks',
    required_skills: [
      { name: 'Networking (TCP/IP, OSI Model)', priority: 'high' },
      { name: 'Cisco Routing & Switching', priority: 'high' },
      { name: 'Firewall Configuration', priority: 'high' },
      { name: 'VPN/SD-WAN', priority: 'medium' },
      { name: 'Network Monitoring (Wireshark)', priority: 'high' },
      { name: 'Linux', priority: 'medium' },
      { name: 'BGP/OSPF Protocols', priority: 'medium' },
      { name: 'Network Security', priority: 'medium' },
      { name: 'CCNA Certification', priority: 'medium' },
      { name: 'Cloud Networking', priority: 'low' },
    ],
    priority_skills: ['Networking (TCP/IP, OSI Model)', 'Cisco Routing & Switching', 'Firewall Configuration', 'Network Monitoring'],
  },

  {
    id: 'database-administrator',
    role_name: 'Database Administrator (DBA)',
    description: 'Manage, optimize, and secure enterprise databases',
    required_skills: [
      { name: 'SQL (MySQL/PostgreSQL)', priority: 'high' },
      { name: 'Database Design & Normalization', priority: 'high' },
      { name: 'Performance Tuning', priority: 'high' },
      { name: 'Backup & Recovery', priority: 'high' },
      { name: 'Oracle DB', priority: 'medium' },
      { name: 'MongoDB', priority: 'medium' },
      { name: 'Replication & Clustering', priority: 'medium' },
      { name: 'Linux', priority: 'medium' },
      { name: 'PL/SQL', priority: 'medium' },
      { name: 'Cloud Databases (AWS RDS)', priority: 'low' },
    ],
    priority_skills: ['SQL', 'Database Design', 'Performance Tuning', 'Backup & Recovery', 'PL/SQL'],
  },

  {
    id: 'it-business-analyst',
    role_name: 'IT Business Analyst',
    description: 'Bridge business needs and IT solutions through analysis and documentation',
    required_skills: [
      { name: 'Requirements Gathering', priority: 'high' },
      { name: 'Business Process Modelling (BPMN)', priority: 'high' },
      { name: 'SQL', priority: 'medium' },
      { name: 'JIRA / Confluence', priority: 'high' },
      { name: 'Data Analysis', priority: 'medium' },
      { name: 'Stakeholder Communication', priority: 'high' },
      { name: 'Agile/Scrum', priority: 'high' },
      { name: 'Use Case / User Stories', priority: 'high' },
      { name: 'Excel & Power BI', priority: 'medium' },
      { name: 'UAT Coordination', priority: 'medium' },
    ],
    priority_skills: ['Requirements Gathering', 'Business Process Modelling', 'JIRA', 'Agile/Scrum', 'Use Case Writing'],
  },

  {
    id: 'qa-engineer',
    role_name: 'QA Engineer',
    description: 'Ensure software quality through structured testing and defect tracking',
    required_skills: [
      { name: 'Manual Testing', priority: 'high' },
      { name: 'Test Case Design', priority: 'high' },
      { name: 'API Testing (Postman)', priority: 'high' },
      { name: 'JIRA / Bug Tracking', priority: 'high' },
      { name: 'Selenium Automation', priority: 'medium' },
      { name: 'SQL', priority: 'medium' },
      { name: 'Agile/Scrum', priority: 'medium' },
      { name: 'Regression Testing', priority: 'high' },
      { name: 'Git', priority: 'low' },
      { name: 'Performance Testing', priority: 'low' },
    ],
    priority_skills: ['Manual Testing', 'Test Case Design', 'API Testing', 'JIRA', 'Regression Testing'],
  },

  // ═══════════════════════════════════════
  // AI / ML Branch Roles
  // ═══════════════════════════════════════
  {
    id: 'ml-engineer',
    role_name: 'Machine Learning Engineer',
    description: 'Build, train, and deploy machine learning models at scale',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Machine Learning (Scikit-learn)', priority: 'high' },
      { name: 'Deep Learning (TensorFlow/PyTorch)', priority: 'high' },
      { name: 'Mathematics (Linear Algebra, Calculus)', priority: 'high' },
      { name: 'Statistics & Probability', priority: 'high' },
      { name: 'Pandas & NumPy', priority: 'high' },
      { name: 'SQL', priority: 'medium' },
      { name: 'MLflow / Model Registry', priority: 'medium' },
      { name: 'Feature Engineering', priority: 'high' },
      { name: 'Git', priority: 'medium' },
      { name: 'Docker', priority: 'low' },
      { name: 'Cloud ML (AWS SageMaker/GCP Vertex)', priority: 'low' },
    ],
    priority_skills: ['Python', 'Machine Learning', 'Deep Learning', 'Pandas & NumPy', 'Statistics', 'Feature Engineering'],
  },

  {
    id: 'ai-research-engineer',
    role_name: 'AI Research Engineer',
    description: 'Research, prototype, and publish novel AI algorithms and models',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Deep Learning (PyTorch)', priority: 'high' },
      { name: 'Mathematics (Linear Algebra, Calculus, Probability)', priority: 'high' },
      { name: 'Research Paper Reading & Implementation', priority: 'high' },
      { name: 'Transformers & LLMs', priority: 'high' },
      { name: 'GPU Programming (CUDA basics)', priority: 'medium' },
      { name: 'Experiment Tracking (Wandb/MLflow)', priority: 'medium' },
      { name: 'Git', priority: 'high' },
      { name: 'Academic Writing', priority: 'low' },
    ],
    priority_skills: ['Python', 'PyTorch', 'Mathematics', 'Research Paper Implementation', 'Transformers & LLMs'],
  },

  {
    id: 'computer-vision-engineer',
    role_name: 'Computer Vision Engineer',
    description: 'Build systems that interpret and analyze visual data (images, video)',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'OpenCV', priority: 'high' },
      { name: 'Deep Learning (PyTorch/TensorFlow)', priority: 'high' },
      { name: 'CNNs & Object Detection (YOLO, ResNet)', priority: 'high' },
      { name: 'Image Processing', priority: 'high' },
      { name: 'Pandas & NumPy', priority: 'medium' },
      { name: 'Mathematics (Linear Algebra)', priority: 'high' },
      { name: 'Data Augmentation', priority: 'medium' },
      { name: 'Git', priority: 'medium' },
      { name: 'Edge Deployment (ONNX)', priority: 'low' },
    ],
    priority_skills: ['Python', 'OpenCV', 'Deep Learning', 'CNNs & Object Detection', 'Image Processing'],
  },

  {
    id: 'nlp-engineer',
    role_name: 'NLP Engineer',
    description: 'Build systems that understand and generate human language',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Transformers (HuggingFace)', priority: 'high' },
      { name: 'NLP Fundamentals (Tokenization, Embeddings)', priority: 'high' },
      { name: 'Deep Learning (PyTorch)', priority: 'high' },
      { name: 'LLMs & Prompt Engineering', priority: 'high' },
      { name: 'SpaCy / NLTK', priority: 'medium' },
      { name: 'Text Classification / NER / QA', priority: 'high' },
      { name: 'Mathematics (Probability, Statistics)', priority: 'medium' },
      { name: 'Git', priority: 'medium' },
      { name: 'RAG Systems', priority: 'medium' },
    ],
    priority_skills: ['Python', 'Transformers', 'NLP Fundamentals', 'Deep Learning', 'LLMs'],
  },

  {
    id: 'mlops-engineer',
    role_name: 'MLOps Engineer',
    description: 'Operationalize ML models with CI/CD, monitoring, and infrastructure',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Docker & Kubernetes', priority: 'high' },
      { name: 'CI/CD for ML (GitHub Actions, MLflow)', priority: 'high' },
      { name: 'Cloud Platforms (AWS/GCP)', priority: 'high' },
      { name: 'Model Monitoring & Drift Detection', priority: 'high' },
      { name: 'Airflow / Prefect (Pipeline Orchestration)', priority: 'medium' },
      { name: 'Feature Stores', priority: 'medium' },
      { name: 'Linux & Bash', priority: 'medium' },
      { name: 'SQL', priority: 'medium' },
      { name: 'Terraform', priority: 'low' },
    ],
    priority_skills: ['Python', 'Docker & Kubernetes', 'CI/CD for ML', 'Cloud Platforms', 'Model Monitoring'],
  },

  {
    id: 'deep-learning-engineer',
    role_name: 'Deep Learning Engineer',
    description: 'Design and optimize deep neural networks for real-world applications',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'PyTorch', priority: 'high' },
      { name: 'TensorFlow/Keras', priority: 'high' },
      { name: 'Neural Network Architectures (CNN, RNN, Transformer)', priority: 'high' },
      { name: 'Mathematics (Calculus, Linear Algebra)', priority: 'high' },
      { name: 'GPU Training & Optimization', priority: 'high' },
      { name: 'Hyperparameter Tuning', priority: 'medium' },
      { name: 'Pandas & NumPy', priority: 'medium' },
      { name: 'Model Compression & Quantization', priority: 'low' },
      { name: 'Git', priority: 'medium' },
    ],
    priority_skills: ['Python', 'PyTorch', 'Neural Network Architectures', 'Mathematics', 'GPU Training'],
  },

  // ═══════════════════════════════════════
  // Data Science Branch Roles
  // ═══════════════════════════════════════
  {
    id: 'data-analyst',
    role_name: 'Data Analyst',
    description: 'Analyze data, generate insights, and drive business decisions',
    required_skills: [
      { name: 'SQL', priority: 'high' },
      { name: 'Python', priority: 'high' },
      { name: 'Excel', priority: 'high' },
      { name: 'Power BI / Tableau', priority: 'high' },
      { name: 'Data Cleaning & Wrangling', priority: 'high' },
      { name: 'Statistics', priority: 'high' },
      { name: 'Pandas & NumPy', priority: 'high' },
      { name: 'Data Visualization', priority: 'high' },
      { name: 'A/B Testing', priority: 'medium' },
      { name: 'Google Analytics', priority: 'low' },
    ],
    priority_skills: ['SQL', 'Python', 'Power BI / Tableau', 'Statistics', 'Data Cleaning', 'Data Visualization'],
  },

  {
    id: 'data-scientist',
    role_name: 'Data Scientist',
    description: 'Build predictive models and extract deep insights from data',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Machine Learning (Scikit-learn)', priority: 'high' },
      { name: 'Statistics & Probability', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'Pandas & NumPy', priority: 'high' },
      { name: 'Feature Engineering', priority: 'high' },
      { name: 'Data Visualization', priority: 'medium' },
      { name: 'Deep Learning (basics)', priority: 'medium' },
      { name: 'A/B Testing', priority: 'medium' },
      { name: 'Experiment Design', priority: 'medium' },
      { name: 'Cloud (AWS/GCP)', priority: 'low' },
    ],
    priority_skills: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Pandas & NumPy', 'Feature Engineering'],
  },

  {
    id: 'bi-analyst',
    role_name: 'Business Intelligence (BI) Analyst',
    description: 'Create dashboards, reports, and data models for business decisions',
    required_skills: [
      { name: 'Power BI / Tableau', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'Excel (Advanced)', priority: 'high' },
      { name: 'Data Modelling (Star/Snowflake Schema)', priority: 'high' },
      { name: 'DAX / MDX', priority: 'high' },
      { name: 'ETL Concepts', priority: 'medium' },
      { name: 'Python (basics)', priority: 'low' },
      { name: 'Business Communication', priority: 'high' },
      { name: 'KPI Design', priority: 'medium' },
    ],
    priority_skills: ['Power BI / Tableau', 'SQL', 'Data Modelling', 'DAX', 'Excel'],
  },

  {
    id: 'data-engineer',
    role_name: 'Data Engineer',
    description: 'Build and maintain scalable data pipelines and infrastructure',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'Apache Spark', priority: 'high' },
      { name: 'ETL Pipelines', priority: 'high' },
      { name: 'Airflow / Prefect', priority: 'high' },
      { name: 'Cloud Data Platforms (BigQuery, Redshift, Snowflake)', priority: 'high' },
      { name: 'Kafka / Streaming', priority: 'medium' },
      { name: 'Data Warehousing', priority: 'high' },
      { name: 'Docker', priority: 'medium' },
      { name: 'dbt', priority: 'medium' },
    ],
    priority_skills: ['Python', 'SQL', 'Apache Spark', 'ETL Pipelines', 'Cloud Data Platforms', 'Airflow'],
  },

  {
    id: 'analytics-consultant',
    role_name: 'Analytics Consultant',
    description: 'Advise businesses on data strategy and analytical solutions',
    required_skills: [
      { name: 'SQL', priority: 'high' },
      { name: 'Python / R', priority: 'medium' },
      { name: 'Power BI / Tableau', priority: 'high' },
      { name: 'Statistical Analysis', priority: 'high' },
      { name: 'Business Communication & Storytelling', priority: 'high' },
      { name: 'Excel (Advanced)', priority: 'high' },
      { name: 'Stakeholder Management', priority: 'high' },
      { name: 'A/B Testing', priority: 'medium' },
      { name: 'Marketing Analytics (basics)', priority: 'low' },
    ],
    priority_skills: ['SQL', 'Power BI / Tableau', 'Statistical Analysis', 'Business Storytelling', 'Excel'],
  },

  {
    id: 'quantitative-analyst',
    role_name: 'Quantitative Analyst',
    description: 'Apply mathematical and statistical models to finance and trading',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'R', priority: 'medium' },
      { name: 'Statistics & Probability', priority: 'high' },
      { name: 'Linear Algebra & Calculus', priority: 'high' },
      { name: 'Financial Modelling', priority: 'high' },
      { name: 'Machine Learning (basics)', priority: 'medium' },
      { name: 'SQL', priority: 'medium' },
      { name: 'Stochastic Calculus', priority: 'medium' },
      { name: 'Time Series Analysis', priority: 'high' },
      { name: 'Risk Management', priority: 'medium' },
    ],
    priority_skills: ['Python', 'Statistics & Probability', 'Financial Modelling', 'Time Series Analysis', 'Linear Algebra'],
  },

  // ═══════════════════════════════════════
  // Cyber Security Branch Roles
  // ═══════════════════════════════════════
  {
    id: 'soc-analyst',
    role_name: 'SOC Analyst (Security Operations Center)',
    description: 'Monitor, detect, and respond to security threats in real-time',
    required_skills: [
      { name: 'SIEM Tools (Splunk/Elastic)', priority: 'high' },
      { name: 'Networking (TCP/IP, Protocols)', priority: 'high' },
      { name: 'Incident Response', priority: 'high' },
      { name: 'Threat Intelligence', priority: 'high' },
      { name: 'Log Analysis', priority: 'high' },
      { name: 'Linux', priority: 'medium' },
      { name: 'Malware Analysis (basics)', priority: 'medium' },
      { name: 'MITRE ATT&CK Framework', priority: 'medium' },
      { name: 'CompTIA Security+ / CEH', priority: 'medium' },
      { name: 'Python Scripting', priority: 'low' },
    ],
    priority_skills: ['SIEM Tools', 'Networking', 'Incident Response', 'Log Analysis', 'Threat Intelligence'],
  },

  {
    id: 'penetration-tester',
    role_name: 'Penetration Tester / Ethical Hacker',
    description: 'Simulate cyberattacks to find vulnerabilities before attackers do',
    required_skills: [
      { name: 'Networking (TCP/IP, OSI)', priority: 'high' },
      { name: 'Kali Linux', priority: 'high' },
      { name: 'Web App Pentesting (OWASP Top 10)', priority: 'high' },
      { name: 'Burp Suite', priority: 'high' },
      { name: 'Metasploit', priority: 'high' },
      { name: 'Python Scripting', priority: 'medium' },
      { name: 'Vulnerability Assessment', priority: 'high' },
      { name: 'Active Directory Attacks', priority: 'medium' },
      { name: 'CEH / OSCP Certification', priority: 'medium' },
      { name: 'Social Engineering', priority: 'low' },
    ],
    priority_skills: ['Networking', 'Kali Linux', 'OWASP Top 10', 'Burp Suite', 'Vulnerability Assessment'],
  },

  {
    id: 'appsec-engineer',
    role_name: 'Application Security Engineer',
    description: 'Secure software from design through deployment using DevSecOps practices',
    required_skills: [
      { name: 'Secure Coding Practices (OWASP)', priority: 'high' },
      { name: 'SAST/DAST Tools (SonarQube, Checkmarx)', priority: 'high' },
      { name: 'Web App Pentesting', priority: 'high' },
      { name: 'Java / Python / JavaScript', priority: 'medium' },
      { name: 'Code Review', priority: 'high' },
      { name: 'Threat Modelling', priority: 'high' },
      { name: 'DevSecOps', priority: 'medium' },
      { name: 'CI/CD Security', priority: 'medium' },
      { name: 'API Security', priority: 'high' },
      { name: 'Authentication & Cryptography', priority: 'medium' },
    ],
    priority_skills: ['OWASP', 'SAST/DAST Tools', 'Threat Modelling', 'API Security', 'Code Review'],
  },

  {
    id: 'cloud-security-engineer',
    role_name: 'Cloud Security Engineer',
    description: 'Secure cloud environments, policies, and workloads',
    required_skills: [
      { name: 'AWS / Azure / GCP Security', priority: 'high' },
      { name: 'IAM & Privilege Management', priority: 'high' },
      { name: 'Cloud Security Best Practices (CIS Benchmarks)', priority: 'high' },
      { name: 'Network Security (VPC, Firewalls)', priority: 'high' },
      { name: 'Kubernetes Security', priority: 'medium' },
      { name: 'CSPM Tools (Prisma, Wiz)', priority: 'medium' },
      { name: 'Encryption & Key Management', priority: 'high' },
      { name: 'Terraform', priority: 'medium' },
      { name: 'Compliance (SOC2, ISO27001)', priority: 'medium' },
      { name: 'Incident Response', priority: 'medium' },
    ],
    priority_skills: ['Cloud Security', 'IAM', 'Network Security', 'Encryption', 'CSPM Tools'],
  },

  {
    id: 'security-consultant',
    role_name: 'Security Consultant',
    description: 'Assess, advise, and improve organizations security posture',
    required_skills: [
      { name: 'Risk Assessment & Management', priority: 'high' },
      { name: 'Security Auditing', priority: 'high' },
      { name: 'Networking Security', priority: 'high' },
      { name: 'NIST / ISO 27001 Framework', priority: 'high' },
      { name: 'Penetration Testing (basics)', priority: 'medium' },
      { name: 'Compliance & Regulatory Knowledge', priority: 'high' },
      { name: 'Report Writing', priority: 'high' },
      { name: 'SIEM Tools', priority: 'medium' },
      { name: 'Business Communication', priority: 'high' },
    ],
    priority_skills: ['Risk Assessment', 'Security Auditing', 'NIST/ISO 27001', 'Compliance', 'Networking Security'],
  },

  {
    id: 'incident-response-analyst',
    role_name: 'Incident Response Analyst',
    description: 'Investigate, contain, and recover from cybersecurity incidents',
    required_skills: [
      { name: 'Digital Forensics', priority: 'high' },
      { name: 'Malware Analysis', priority: 'high' },
      { name: 'SIEM Tools (Splunk)', priority: 'high' },
      { name: 'Memory & Disk Forensics', priority: 'high' },
      { name: 'Threat Hunting', priority: 'high' },
      { name: 'Python Scripting', priority: 'medium' },
      { name: 'Networking (TCP/IP)', priority: 'high' },
      { name: 'Chain of Custody & Legal Knowledge', priority: 'medium' },
      { name: 'IDS/IPS', priority: 'medium' },
    ],
    priority_skills: ['Digital Forensics', 'Malware Analysis', 'SIEM Tools', 'Threat Hunting', 'Memory Forensics'],
  },

  // ═══════════════════════════════════════
  // Cloud Computing Branch Roles
  // ═══════════════════════════════════════
  {
    id: 'cloud-engineer',
    role_name: 'Cloud Engineer (AWS/Azure/GCP)',
    description: 'Build, deploy, and manage cloud infrastructure and services',
    required_skills: [
      { name: 'AWS / Azure / GCP Core Services', priority: 'high' },
      { name: 'Infrastructure as Code (Terraform)', priority: 'high' },
      { name: 'Linux', priority: 'high' },
      { name: 'Networking (VPC, DNS, Load Balancers)', priority: 'high' },
      { name: 'Docker & Kubernetes', priority: 'high' },
      { name: 'CI/CD', priority: 'medium' },
      { name: 'Python / Bash Scripting', priority: 'medium' },
      { name: 'Cloud Cost Optimization', priority: 'medium' },
      { name: 'Monitoring (CloudWatch, Datadog)', priority: 'medium' },
      { name: 'Storage & Databases (S3, RDS)', priority: 'medium' },
    ],
    priority_skills: ['AWS/Azure/GCP', 'Terraform', 'Linux', 'Docker & Kubernetes', 'Networking'],
  },

  {
    id: 'cloud-solutions-architect',
    role_name: 'Cloud Solutions Architect',
    description: 'Design scalable, resilient, and cost-optimized cloud architectures',
    required_skills: [
      { name: 'AWS / Azure / GCP Architecture', priority: 'high' },
      { name: 'System Design (Microservices, Serverless)', priority: 'high' },
      { name: 'Terraform / CloudFormation', priority: 'high' },
      { name: 'Networking (Advanced)', priority: 'high' },
      { name: 'Security & Compliance', priority: 'high' },
      { name: 'Cost Optimization', priority: 'high' },
      { name: 'Kubernetes', priority: 'medium' },
      { name: 'DevOps Practices', priority: 'medium' },
      { name: 'Cloud Certifications (AWS SA, Azure Architect)', priority: 'medium' },
    ],
    priority_skills: ['Cloud Architecture', 'System Design', 'Terraform', 'Networking', 'Security & Compliance'],
  },

  {
    id: 'sre',
    role_name: 'Site Reliability Engineer (SRE)',
    description: 'Ensure reliability, uptime, and performance of production systems',
    required_skills: [
      { name: 'Linux / Unix', priority: 'high' },
      { name: 'Python / Go Scripting', priority: 'high' },
      { name: 'Kubernetes & Docker', priority: 'high' },
      { name: 'Monitoring & Alerting (Prometheus, Grafana)', priority: 'high' },
      { name: 'Incident Management', priority: 'high' },
      { name: 'SLOs / SLAs / Error Budgets', priority: 'high' },
      { name: 'CI/CD', priority: 'medium' },
      { name: 'Distributed Systems', priority: 'medium' },
      { name: 'Chaos Engineering', priority: 'low' },
      { name: 'Cloud Platforms (AWS/GCP)', priority: 'medium' },
    ],
    priority_skills: ['Linux', 'Python / Go', 'Kubernetes', 'Monitoring', 'Incident Management', 'SLOs/Error Budgets'],
  },

  {
    id: 'platform-engineer',
    role_name: 'Platform Engineer',
    description: 'Build internal developer platforms, tooling, and self-service infrastructure',
    required_skills: [
      { name: 'Kubernetes', priority: 'high' },
      { name: 'Terraform / Helm', priority: 'high' },
      { name: 'CI/CD Pipelines', priority: 'high' },
      { name: 'Go / Python', priority: 'high' },
      { name: 'Service Mesh (Istio)', priority: 'medium' },
      { name: 'Linux', priority: 'high' },
      { name: 'Internal Developer Portals (Backstage)', priority: 'medium' },
      { name: 'Cloud Platforms', priority: 'high' },
      { name: 'Observability', priority: 'medium' },
    ],
    priority_skills: ['Kubernetes', 'Terraform/Helm', 'CI/CD', 'Go / Python', 'Cloud Platforms'],
  },

  // ═══════════════════════════════════════
  // Mathematics & Computing Branch Roles
  // ═══════════════════════════════════════
  {
    id: 'quant-developer',
    role_name: 'Quantitative Analyst / Quant Developer',
    description: 'Build quantitative financial models and algorithmic trading systems',
    required_skills: [
      { name: 'Python / C++', priority: 'high' },
      { name: 'Statistics & Probability', priority: 'high' },
      { name: 'Linear Algebra & Calculus', priority: 'high' },
      { name: 'Financial Modelling', priority: 'high' },
      { name: 'Algorithmic Trading', priority: 'high' },
      { name: 'Time Series Analysis', priority: 'high' },
      { name: 'Machine Learning', priority: 'medium' },
      { name: 'SQL', priority: 'medium' },
      { name: 'Risk Management', priority: 'medium' },
      { name: 'Monte Carlo Simulation', priority: 'medium' },
    ],
    priority_skills: ['Python/C++', 'Statistics', 'Financial Modelling', 'Time Series Analysis', 'Linear Algebra'],
  },

  {
    id: 'research-analyst',
    role_name: 'Research Analyst',
    description: 'Conduct research, model data, and produce analytical reports',
    required_skills: [
      { name: 'Python / R', priority: 'high' },
      { name: 'Statistics & Econometrics', priority: 'high' },
      { name: 'Data Analysis', priority: 'high' },
      { name: 'Excel & Power BI', priority: 'high' },
      { name: 'Literature Review', priority: 'medium' },
      { name: 'SQL', priority: 'medium' },
      { name: 'Report Writing', priority: 'high' },
      { name: 'SPSS / STATA', priority: 'low' },
    ],
    priority_skills: ['Python / R', 'Statistics', 'Data Analysis', 'Report Writing', 'Excel'],
  },

  {
    id: 'algorithm-engineer',
    role_name: 'Algorithm Engineer',
    description: 'Design and optimize algorithms for performance-critical applications',
    required_skills: [
      { name: 'Data Structures & Algorithms', priority: 'high' },
      { name: 'C++ / Python', priority: 'high' },
      { name: 'Competitive Programming', priority: 'high' },
      { name: 'Mathematics (Graph Theory, Combinatorics)', priority: 'high' },
      { name: 'Complexity Analysis', priority: 'high' },
      { name: 'Optimization Techniques', priority: 'high' },
      { name: 'Dynamic Programming', priority: 'high' },
      { name: 'Distributed Algorithms', priority: 'medium' },
      { name: 'Git', priority: 'medium' },
    ],
    priority_skills: ['DSA', 'C++ / Python', 'Mathematics', 'Complexity Analysis', 'Dynamic Programming', 'Optimization'],
  },

  // ═══════════════════════════════════════
  // MCA Roles
  // ═══════════════════════════════════════
  {
    id: 'mca-software-developer',
    role_name: 'Software Developer',
    description: 'Develop and maintain enterprise software applications',
    required_skills: [
      { name: 'Java / Python', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'Data Structures & Algorithms', priority: 'high' },
      { name: 'OOP Concepts', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'REST APIs', priority: 'medium' },
      { name: 'Spring Boot / Django', priority: 'medium' },
      { name: 'Problem Solving', priority: 'high' },
      { name: 'Agile/Scrum', priority: 'low' },
    ],
    priority_skills: ['Java / Python', 'SQL', 'DSA', 'OOP Concepts', 'Git'],
  },

  {
    id: 'systems-analyst',
    role_name: 'Systems Analyst',
    description: 'Analyze IT systems, gather requirements, and bridge IT and business',
    required_skills: [
      { name: 'System Analysis & Design', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'Requirements Gathering', priority: 'high' },
      { name: 'UML Diagrams', priority: 'high' },
      { name: 'Business Communication', priority: 'high' },
      { name: 'Agile/Scrum', priority: 'medium' },
      { name: 'JIRA / Confluence', priority: 'medium' },
      { name: 'Basic Programming', priority: 'medium' },
      { name: 'ERP Systems', priority: 'low' },
    ],
    priority_skills: ['System Analysis', 'SQL', 'Requirements Gathering', 'UML', 'Business Communication'],
  },

  {
    id: 'database-developer',
    role_name: 'Database Developer',
    description: 'Design, develop, and optimize databases and stored procedures',
    required_skills: [
      { name: 'SQL (MySQL/PostgreSQL/Oracle)', priority: 'high' },
      { name: 'PL/SQL / T-SQL', priority: 'high' },
      { name: 'Database Design', priority: 'high' },
      { name: 'Performance Tuning', priority: 'high' },
      { name: 'ETL Concepts', priority: 'medium' },
      { name: 'MongoDB', priority: 'medium' },
      { name: 'Backup & Recovery', priority: 'medium' },
      { name: 'Data Modelling', priority: 'high' },
      { name: 'Linux', priority: 'low' },
    ],
    priority_skills: ['SQL', 'PL/SQL', 'Database Design', 'Performance Tuning', 'Data Modelling'],
  },

  {
    id: 'application-developer',
    role_name: 'Application Developer',
    description: 'Build desktop, web, or mobile applications',
    required_skills: [
      { name: 'Java', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'JavaScript', priority: 'medium' },
      { name: 'SQL', priority: 'high' },
      { name: 'OOP Concepts', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'React / Angular', priority: 'medium' },
      { name: 'REST APIs', priority: 'medium' },
      { name: 'Testing & Debugging', priority: 'medium' },
    ],
    priority_skills: ['Java', 'SQL', 'OOP Concepts', 'Git', 'REST APIs'],
  },

  // ═══════════════════════════════════════
  // BCA Roles
  // ═══════════════════════════════════════
  {
    id: 'junior-software-developer',
    role_name: 'Junior Software Developer',
    description: 'Develop and test software features under senior guidance',
    required_skills: [
      { name: 'Python / Java', priority: 'high' },
      { name: 'HTML / CSS', priority: 'medium' },
      { name: 'JavaScript', priority: 'medium' },
      { name: 'SQL', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'OOP Concepts', priority: 'high' },
      { name: 'Problem Solving', priority: 'high' },
      { name: 'REST APIs (basics)', priority: 'medium' },
    ],
    priority_skills: ['Python / Java', 'SQL', 'OOP Concepts', 'Git', 'Problem Solving'],
  },

  {
    id: 'web-developer',
    role_name: 'Web Developer',
    description: 'Build and maintain responsive websites and web applications',
    required_skills: [
      { name: 'HTML', priority: 'high' },
      { name: 'CSS', priority: 'high' },
      { name: 'JavaScript', priority: 'high' },
      { name: 'React / Vue', priority: 'medium' },
      { name: 'PHP / Node.js', priority: 'medium' },
      { name: 'SQL / MySQL', priority: 'medium' },
      { name: 'Git', priority: 'high' },
      { name: 'Responsive Design', priority: 'high' },
      { name: 'WordPress', priority: 'low' },
    ],
    priority_skills: ['HTML', 'CSS', 'JavaScript', 'Git', 'Responsive Design'],
  },

  {
    id: 'it-support-analyst',
    role_name: 'IT Support Analyst',
    description: 'Provide technical assistance and resolve IT issues for end users',
    required_skills: [
      { name: 'Windows & Mac OS Troubleshooting', priority: 'high' },
      { name: 'Networking Basics', priority: 'high' },
      { name: 'Active Directory', priority: 'medium' },
      { name: 'Help Desk (ITSM Tools)', priority: 'high' },
      { name: 'Hardware Support', priority: 'high' },
      { name: 'Microsoft 365', priority: 'medium' },
      { name: 'Remote Desktop Tools', priority: 'medium' },
      { name: 'Documentation', priority: 'medium' },
    ],
    priority_skills: ['Troubleshooting', 'Networking Basics', 'Help Desk Tools', 'Hardware Support'],
  },

  {
    id: 'qa-tester',
    role_name: 'QA Tester',
    description: 'Execute test cases and report bugs to ensure software quality',
    required_skills: [
      { name: 'Manual Testing', priority: 'high' },
      { name: 'Test Case Writing', priority: 'high' },
      { name: 'Bug Reporting (JIRA)', priority: 'high' },
      { name: 'API Testing (Postman)', priority: 'medium' },
      { name: 'Regression Testing', priority: 'high' },
      { name: 'SQL (basic)', priority: 'medium' },
      { name: 'Agile Basics', priority: 'medium' },
    ],
    priority_skills: ['Manual Testing', 'Test Case Writing', 'Bug Reporting', 'Regression Testing'],
  },

  {
    id: 'technical-support-engineer',
    role_name: 'Technical Support Engineer',
    description: 'Provide technical support, diagnose issues, and escalate problems',
    required_skills: [
      { name: 'Troubleshooting & Debugging', priority: 'high' },
      { name: 'Networking Basics', priority: 'high' },
      { name: 'SQL (basic)', priority: 'medium' },
      { name: 'Customer Communication', priority: 'high' },
      { name: 'Linux Basics', priority: 'medium' },
      { name: 'Log Analysis', priority: 'medium' },
      { name: 'Documentation', priority: 'high' },
      { name: 'API Basics', priority: 'low' },
    ],
    priority_skills: ['Troubleshooting', 'Networking', 'Customer Communication', 'Documentation'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BRANCH → ROLES MAPPING
// Each branch maps to the role IDs relevant for that branch
// ─────────────────────────────────────────────────────────────────────────────
export const BRANCH_CAREER_MAP = {
  'Computer Science Engineering': [
    'sde-backend', 'frontend-developer', 'fullstack-developer',
    'mobile-app-developer', 'devops-engineer', 'qa-sdet', 'systems-engineer',
  ],
  'Information Technology': [
    'software-developer', 'it-support-sysadmin', 'network-engineer',
    'database-administrator', 'it-business-analyst', 'qa-engineer',
  ],
  'Artificial Intelligence & Machine Learning': [
    'ml-engineer', 'ai-research-engineer', 'computer-vision-engineer',
    'nlp-engineer', 'mlops-engineer', 'deep-learning-engineer',
  ],
  'Data Science': [
    'data-analyst', 'data-scientist', 'bi-analyst',
    'data-engineer', 'analytics-consultant', 'quantitative-analyst',
  ],
  'Cyber Security': [
    'soc-analyst', 'penetration-tester', 'appsec-engineer',
    'cloud-security-engineer', 'security-consultant', 'incident-response-analyst',
  ],
  'Cloud Computing': [
    'cloud-engineer', 'cloud-solutions-architect', 'sre',
    'devops-engineer', 'cloud-security-engineer', 'platform-engineer',
  ],
  'Mathematics & Computing': [
    'quant-developer', 'data-scientist', 'sde-backend',
    'research-analyst', 'quantitative-analyst', 'algorithm-engineer',
  ],
  'MCA (Computer Applications)': [
    'mca-software-developer', 'fullstack-developer', 'systems-analyst',
    'database-developer', 'application-developer', 'qa-engineer',
  ],
  'BCA (Computer Applications)': [
    'junior-software-developer', 'web-developer', 'it-support-analyst',
    'qa-tester', 'systems-analyst', 'technical-support-engineer',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ALL SKILLS (deduplicated union — used for the skill selector UI)
// ─────────────────────────────────────────────────────────────────────────────
export const allSkills = Array.from(new Set([
  // Programming Languages
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C', 'Go', 'Kotlin', 'Swift', 'R', 'PHP',
  // Web Dev
  'HTML', 'CSS', 'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express.js', 'Spring Boot',
  'Django', 'FastAPI', 'Tailwind CSS', 'Responsive Design', 'Webpack/Vite', 'WordPress',
  // Mobile
  'React Native', 'Flutter', 'Android SDK', 'Swift/iOS', 'App Store Deployment',
  // Databases
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle DB', 'SQLite', 'Firebase',
  'PL/SQL', 'T-SQL', 'Data Warehousing', 'Database Design', 'ETL Concepts',
  // Cloud & DevOps
  'AWS/GCP', 'AWS/GCP/Azure', 'AWS / Azure / GCP Core Services', 'Docker', 'Kubernetes',
  'Terraform', 'Helm', 'CI/CD (Jenkins/GitHub Actions)', 'CI/CD', 'Linux', 'Linux/Unix',
  'Bash Scripting', 'Python/Bash Scripting', 'Ansible', 'Monitoring (Prometheus/Grafana)',
  'CloudWatch', 'Airflow / Prefect', 'Apache Spark', 'dbt', 'Kafka / Streaming',
  'Platform Engineering', 'Site Reliability', 'Service Mesh (Istio)', 'Chaos Engineering',
  // AI/ML
  'Machine Learning', 'Deep Learning', 'Machine Learning (Scikit-learn)', 'Scikit-learn',
  'TensorFlow', 'PyTorch', 'TensorFlow/PyTorch', 'Pandas & NumPy', 'Pandas', 'NumPy',
  'NLP', 'Computer Vision', 'OpenCV', 'CNNs & Object Detection', 'Transformers (HuggingFace)',
  'LLMs & Prompt Engineering', 'RAG Systems', 'SpaCy / NLTK', 'Feature Engineering',
  'Hyperparameter Tuning', 'GPU Training', 'MLflow', 'Experiment Tracking (Wandb/MLflow)',
  'Model Monitoring & Drift Detection', 'Feature Stores', 'Neural Networks', 'CUDA',
  // Data & Analytics
  'Power BI / Tableau', 'Power BI/Tableau', 'Excel', 'Data Cleaning & Wrangling',
  'Statistics', 'Statistics & Probability', 'Data Visualization', 'A/B Testing',
  'Google Analytics', 'Time Series Analysis', 'Financial Modelling', 'DAX / MDX',
  'Data Modelling', 'Statistical Analysis', 'Business Storytelling',
  // Cyber Security
  'SIEM Tools (Splunk/Elastic)', 'Kali Linux', 'Web App Pentesting (OWASP Top 10)',
  'Burp Suite', 'Metasploit', 'Vulnerability Assessment', 'CEH / OSCP Certification',
  'Digital Forensics', 'Malware Analysis', 'Threat Intelligence', 'Incident Response',
  'MITRE ATT&CK Framework', 'Network Security', 'NIST / ISO 27001 Framework',
  'IAM & Privilege Management', 'Encryption & Key Management', 'CSPM Tools',
  'Penetration Testing', 'CompTIA Security+', 'Log Analysis', 'Threat Hunting',
  'Secure Coding Practices (OWASP)', 'SAST/DAST Tools', 'Threat Modelling', 'API Security',
  'DevSecOps', 'Cloud Security', 'Risk Assessment & Management',
  // Networking
  'Networking Basics', 'Networking (TCP/IP, OSI Model)', 'Cisco Routing & Switching',
  'Firewall Configuration', 'VPN/SD-WAN', 'Network Monitoring (Wireshark)',
  'BGP/OSPF Protocols', 'CCNA Certification',
  // General CS
  'Data Structures & Algorithms', 'Data Structures', 'Algorithms', 'OOP Concepts',
  'System Design', 'REST APIs', 'GraphQL', 'Microservices', 'Problem Solving',
  'Competitive Programming', 'Dynamic Programming', 'Authentication (JWT)',
  'Git', 'Agile/Scrum', 'JIRA / Confluence', 'Testing (Jest)', 'Selenium',
  'Manual Testing', 'Test Case Design', 'API Testing (Postman)', 'Performance Testing',
  'Regression Testing', 'UI/UX Design', 'Documentation',
  // Admin / Analyst
  'Windows Server Administration', 'Linux Administration', 'Active Directory',
  'Backup & Recovery', 'Virtualization (VMware/Hyper-V)', 'Microsoft 365',
  'Help Desk / ITSM Tools', 'Requirements Gathering', 'Business Process Modelling (BPMN)',
  'Stakeholder Communication', 'Use Case / User Stories', 'UML Diagrams',
  'System Analysis & Design', 'ERP Systems', 'SAP/ERP', 'Report Writing',
  'Customer Communication', 'Business Communication', 'SPSS / STATA',
  // Math/Finance
  'Mathematics (Linear Algebra, Calculus)', 'Linear Algebra & Calculus',
  'Stochastic Calculus', 'Monte Carlo Simulation', 'Algorithmic Trading',
  'Risk Management', 'Actuarial Analysis', 'Quantitative Analysis',
  'Econometrics', 'Literature Review',
]));

// ─────────────────────────────────────────────────────────────────────────────
// BRANCH OPTIONS (only the 9 supported branches)
// ─────────────────────────────────────────────────────────────────────────────
export const branches = [
  'Computer Science Engineering',
  'Information Technology',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Cyber Security',
  'Cloud Computing',
  'Mathematics & Computing',
  'MCA (Computer Applications)',
  'BCA (Computer Applications)',
];

// ─────────────────────────────────────────────────────────────────────────────
// OTHER EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export const years = [1, 2, 3, 4];

export const passoutYears = [
  2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032,
];

export default industryRoles;
