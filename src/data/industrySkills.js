/**
 * Industry Skill Dataset
 * 
 * This dataset contains career roles and their required skills
 * with priority levels for the Skill Gap Analyzer MVP.
 * 
 * Priority Levels:
 * - high: Must-have skills for the role
 * - medium: Important skills that add value
 * - low: Nice-to-have skills
 */

export const industryRoles = [
  {
    id: 'frontend-developer',
    role_name: 'Frontend Developer',
    description: 'Build user interfaces and web applications',
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
      { name: 'Testing (Jest)', priority: 'low' },
      { name: 'Webpack/Vite', priority: 'low' },
      { name: 'Next.js', priority: 'medium' }
    ],
    priority_skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git']
  },
  {
    id: 'backend-developer',
    role_name: 'Backend Developer',
    description: 'Build server-side logic and APIs',
    required_skills: [
      { name: 'Node.js', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'SQL', priority: 'high' },
      { name: 'REST APIs', priority: 'high' },
      { name: 'MongoDB', priority: 'medium' },
      { name: 'Git', priority: 'high' },
      { name: 'Express.js', priority: 'high' },
      { name: 'Authentication (JWT)', priority: 'medium' },
      { name: 'Docker', priority: 'medium' },
      { name: 'AWS/GCP', priority: 'low' },
      { name: 'GraphQL', priority: 'low' },
      { name: 'Redis', priority: 'low' }
    ],
    priority_skills: ['Node.js', 'SQL', 'REST APIs', 'Git', 'Express.js']
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
      { name: 'Docker', priority: 'medium' },
      { name: 'TypeScript', priority: 'medium' },
      { name: 'AWS/GCP', priority: 'low' }
    ],
    priority_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs']
  },
  {
    id: 'data-analyst',
    role_name: 'Data Analyst',
    description: 'Analyze data and generate insights',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'SQL', priority: 'high' },
      { name: 'Excel', priority: 'high' },
      { name: 'Data Visualization', priority: 'high' },
      { name: 'Pandas', priority: 'high' },
      { name: 'Statistics', priority: 'high' },
      { name: 'Power BI/Tableau', priority: 'medium' },
      { name: 'NumPy', priority: 'medium' },
      { name: 'Data Cleaning', priority: 'high' },
      { name: 'R', priority: 'low' },
      { name: 'A/B Testing', priority: 'medium' },
      { name: 'Google Analytics', priority: 'low' }
    ],
    priority_skills: ['Python', 'SQL', 'Excel', 'Data Visualization', 'Pandas', 'Statistics']
  },
  {
    id: 'ai-ml-engineer',
    role_name: 'AI/ML Engineer',
    description: 'Build and deploy machine learning models',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'Machine Learning', priority: 'high' },
      { name: 'Deep Learning', priority: 'high' },
      { name: 'TensorFlow/PyTorch', priority: 'high' },
      { name: 'NumPy', priority: 'high' },
      { name: 'Pandas', priority: 'high' },
      { name: 'Scikit-learn', priority: 'high' },
      { name: 'Mathematics', priority: 'high' },
      { name: 'Statistics', priority: 'high' },
      { name: 'NLP', priority: 'medium' },
      { name: 'Computer Vision', priority: 'medium' },
      { name: 'MLOps', priority: 'low' },
      { name: 'SQL', priority: 'medium' },
      { name: 'Git', priority: 'medium' }
    ],
    priority_skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow/PyTorch', 'Mathematics']
  },
  {
    id: 'devops-engineer',
    role_name: 'DevOps Engineer',
    description: 'Manage infrastructure and deployment pipelines',
    required_skills: [
      { name: 'Linux', priority: 'high' },
      { name: 'Docker', priority: 'high' },
      { name: 'Kubernetes', priority: 'high' },
      { name: 'CI/CD', priority: 'high' },
      { name: 'AWS/GCP/Azure', priority: 'high' },
      { name: 'Git', priority: 'high' },
      { name: 'Python/Bash', priority: 'medium' },
      { name: 'Terraform', priority: 'medium' },
      { name: 'Monitoring (Prometheus)', priority: 'medium' },
      { name: 'Networking', priority: 'medium' },
      { name: 'Security', priority: 'medium' },
      { name: 'Ansible', priority: 'low' }
    ],
    priority_skills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS/GCP/Azure', 'Git']
  },
  {
    id: 'mobile-developer',
    role_name: 'Mobile Developer',
    description: 'Build mobile applications for iOS and Android',
    required_skills: [
      { name: 'React Native', priority: 'high' },
      { name: 'JavaScript', priority: 'high' },
      { name: 'TypeScript', priority: 'medium' },
      { name: 'Flutter', priority: 'medium' },
      { name: 'Git', priority: 'high' },
      { name: 'REST APIs', priority: 'high' },
      { name: 'Firebase', priority: 'medium' },
      { name: 'iOS (Swift)', priority: 'medium' },
      { name: 'Android (Kotlin)', priority: 'medium' },
      { name: 'App Store Deployment', priority: 'low' },
      { name: 'UI/UX Design', priority: 'medium' },
      { name: 'State Management', priority: 'medium' }
    ],
    priority_skills: ['React Native', 'JavaScript', 'Git', 'REST APIs']
  },
  {
    id: 'cloud-engineer',
    role_name: 'Cloud Engineer',
    description: 'Design and manage cloud infrastructure',
    required_skills: [
      { name: 'AWS/GCP/Azure', priority: 'high' },
      { name: 'Linux', priority: 'high' },
      { name: 'Networking', priority: 'high' },
      { name: 'Docker', priority: 'high' },
      { name: 'Kubernetes', priority: 'medium' },
      { name: 'Terraform', priority: 'high' },
      { name: 'Python/Bash', priority: 'medium' },
      { name: 'Security', priority: 'high' },
      { name: 'CI/CD', priority: 'medium' },
      { name: 'Serverless', priority: 'medium' },
      { name: 'Databases', priority: 'medium' },
      { name: 'Cost Optimization', priority: 'low' }
    ],
    priority_skills: ['AWS/GCP/Azure', 'Linux', 'Networking', 'Docker', 'Terraform', 'Security']
  },

  // ======= Mechanical Engineering Roles =======
  {
    id: 'mechanical-design-engineer',
    role_name: 'Mechanical Design Engineer',
    description: 'Design mechanical components and systems using CAD tools',
    required_skills: [
      { name: 'AutoCAD', priority: 'high' },
      { name: 'SolidWorks', priority: 'high' },
      { name: 'CATIA', priority: 'medium' },
      { name: 'GD&T', priority: 'high' },
      { name: 'FEA Analysis', priority: 'medium' },
      { name: 'Material Science', priority: 'high' },
      { name: 'Thermodynamics', priority: 'medium' },
      { name: 'Manufacturing Processes', priority: 'high' },
      { name: '3D Printing', priority: 'low' },
      { name: 'Product Lifecycle Management', priority: 'medium' }
    ],
    priority_skills: ['AutoCAD', 'SolidWorks', 'GD&T', 'Material Science', 'Manufacturing Processes']
  },
  {
    id: 'manufacturing-engineer',
    role_name: 'Manufacturing Engineer',
    description: 'Optimize manufacturing processes and production systems',
    required_skills: [
      { name: 'Lean Manufacturing', priority: 'high' },
      { name: 'Six Sigma', priority: 'high' },
      { name: 'CNC Programming', priority: 'medium' },
      { name: 'Quality Control', priority: 'high' },
      { name: 'AutoCAD', priority: 'medium' },
      { name: 'SolidWorks', priority: 'medium' },
      { name: 'Supply Chain Management', priority: 'medium' },
      { name: 'Process Optimization', priority: 'high' },
      { name: 'SAP/ERP', priority: 'medium' },
      { name: 'Industrial Safety', priority: 'low' }
    ],
    priority_skills: ['Lean Manufacturing', 'Six Sigma', 'Quality Control', 'Process Optimization']
  },
  {
    id: 'robotics-engineer',
    role_name: 'Robotics Engineer',
    description: 'Design and program robotic systems and automation',
    required_skills: [
      { name: 'Python', priority: 'high' },
      { name: 'ROS', priority: 'high' },
      { name: 'C++', priority: 'high' },
      { name: 'Arduino/Raspberry Pi', priority: 'medium' },
      { name: 'Control Systems', priority: 'high' },
      { name: 'Embedded Systems', priority: 'high' },
      { name: 'Machine Learning', priority: 'medium' },
      { name: 'Computer Vision', priority: 'medium' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'SolidWorks', priority: 'low' }
    ],
    priority_skills: ['Python', 'ROS', 'C++', 'Control Systems', 'Embedded Systems']
  },

  // ======= Electrical Engineering Roles =======
  {
    id: 'power-systems-engineer',
    role_name: 'Power Systems Engineer',
    description: 'Design and maintain electrical power systems',
    required_skills: [
      { name: 'Power Systems Analysis', priority: 'high' },
      { name: 'MATLAB/Simulink', priority: 'high' },
      { name: 'Circuit Design', priority: 'high' },
      { name: 'PLC Programming', priority: 'medium' },
      { name: 'SCADA Systems', priority: 'medium' },
      { name: 'AutoCAD Electrical', priority: 'medium' },
      { name: 'Renewable Energy', priority: 'medium' },
      { name: 'Electrical Safety Standards', priority: 'high' },
      { name: 'Power Electronics', priority: 'high' },
      { name: 'Signal Processing', priority: 'low' }
    ],
    priority_skills: ['Power Systems Analysis', 'MATLAB/Simulink', 'Circuit Design', 'Power Electronics']
  },

  // ======= Electronics & Communication Roles =======
  {
    id: 'embedded-systems-engineer',
    role_name: 'Embedded Systems Engineer',
    description: 'Develop firmware and embedded software for hardware devices',
    required_skills: [
      { name: 'Embedded C', priority: 'high' },
      { name: 'C++', priority: 'high' },
      { name: 'Microcontrollers', priority: 'high' },
      { name: 'RTOS', priority: 'high' },
      { name: 'Arduino/Raspberry Pi', priority: 'medium' },
      { name: 'PCB Design', priority: 'medium' },
      { name: 'Communication Protocols', priority: 'high' },
      { name: 'Signal Processing', priority: 'medium' },
      { name: 'IoT', priority: 'medium' },
      { name: 'VHDL/Verilog', priority: 'low' }
    ],
    priority_skills: ['Embedded C', 'C++', 'Microcontrollers', 'RTOS', 'Communication Protocols']
  },
  {
    id: 'vlsi-design-engineer',
    role_name: 'VLSI Design Engineer',
    description: 'Design and verify integrated circuits and chip architectures',
    required_skills: [
      { name: 'VHDL/Verilog', priority: 'high' },
      { name: 'Digital Electronics', priority: 'high' },
      { name: 'FPGA', priority: 'high' },
      { name: 'Cadence/Synopsys Tools', priority: 'high' },
      { name: 'CMOS Design', priority: 'high' },
      { name: 'SystemVerilog', priority: 'medium' },
      { name: 'Python', priority: 'medium' },
      { name: 'Circuit Simulation', priority: 'medium' },
      { name: 'Timing Analysis', priority: 'medium' },
      { name: 'Low Power Design', priority: 'low' }
    ],
    priority_skills: ['VHDL/Verilog', 'Digital Electronics', 'FPGA', 'Cadence/Synopsys Tools', 'CMOS Design']
  },

  // ======= Civil Engineering Roles =======
  {
    id: 'structural-engineer',
    role_name: 'Structural Engineer',
    description: 'Design and analyze building structures and infrastructure',
    required_skills: [
      { name: 'AutoCAD', priority: 'high' },
      { name: 'STAAD Pro', priority: 'high' },
      { name: 'ETABS', priority: 'high' },
      { name: 'Structural Analysis', priority: 'high' },
      { name: 'Revit', priority: 'medium' },
      { name: 'Concrete Design', priority: 'high' },
      { name: 'Steel Design', priority: 'high' },
      { name: 'Building Codes', priority: 'high' },
      { name: 'Project Management', priority: 'medium' },
      { name: 'Surveying', priority: 'low' }
    ],
    priority_skills: ['AutoCAD', 'STAAD Pro', 'ETABS', 'Structural Analysis', 'Concrete Design']
  },
  {
    id: 'construction-manager',
    role_name: 'Construction Project Manager',
    description: 'Plan and manage construction projects from start to finish',
    required_skills: [
      { name: 'Project Management', priority: 'high' },
      { name: 'MS Project/Primavera', priority: 'high' },
      { name: 'AutoCAD', priority: 'medium' },
      { name: 'Cost Estimation', priority: 'high' },
      { name: 'Quality Management', priority: 'high' },
      { name: 'Safety Management', priority: 'high' },
      { name: 'Contract Management', priority: 'medium' },
      { name: 'BIM (Revit)', priority: 'medium' },
      { name: 'Scheduling', priority: 'high' },
      { name: 'Communication', priority: 'medium' }
    ],
    priority_skills: ['Project Management', 'MS Project/Primavera', 'Cost Estimation', 'Scheduling']
  },

  // ======= Chemical / Biotech Roles =======
  {
    id: 'process-engineer',
    role_name: 'Process Engineer',
    description: 'Design and optimize chemical and industrial processes',
    required_skills: [
      { name: 'Process Simulation', priority: 'high' },
      { name: 'Aspen Plus/HYSYS', priority: 'high' },
      { name: 'Chemical Engineering Fundamentals', priority: 'high' },
      { name: 'Process Safety', priority: 'high' },
      { name: 'Quality Control', priority: 'medium' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'P&ID', priority: 'high' },
      { name: 'Six Sigma', priority: 'medium' },
      { name: 'Environmental Compliance', priority: 'medium' },
      { name: 'AutoCAD', priority: 'low' }
    ],
    priority_skills: ['Process Simulation', 'Aspen Plus/HYSYS', 'Chemical Engineering Fundamentals', 'P&ID']
  },
  {
    id: 'biotech-research',
    role_name: 'Biotech Research Scientist',
    description: 'Conduct research in biotechnology, pharmaceuticals, and life sciences',
    required_skills: [
      { name: 'Molecular Biology', priority: 'high' },
      { name: 'Bioinformatics', priority: 'high' },
      { name: 'Lab Techniques', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'R', priority: 'medium' },
      { name: 'Statistics', priority: 'high' },
      { name: 'Research Methodology', priority: 'high' },
      { name: 'Data Analysis', priority: 'medium' },
      { name: 'Scientific Writing', priority: 'medium' },
      { name: 'Machine Learning', priority: 'low' }
    ],
    priority_skills: ['Molecular Biology', 'Bioinformatics', 'Lab Techniques', 'Statistics', 'Research Methodology']
  },

  // ======= More Mechanical Roles =======
  {
    id: 'automotive-engineer',
    role_name: 'Automotive Engineer',
    description: 'Design and develop automotive systems, vehicles, and components',
    required_skills: [
      { name: 'AutoCAD', priority: 'high' },
      { name: 'SolidWorks', priority: 'high' },
      { name: 'CATIA', priority: 'high' },
      { name: 'Vehicle Dynamics', priority: 'high' },
      { name: 'Thermodynamics', priority: 'high' },
      { name: 'FEA Analysis', priority: 'high' },
      { name: 'CFD Analysis', priority: 'medium' },
      { name: 'IC Engines', priority: 'high' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'Manufacturing Processes', priority: 'medium' }
    ],
    priority_skills: ['CATIA', 'Vehicle Dynamics', 'FEA Analysis', 'IC Engines', 'SolidWorks']
  },
  {
    id: 'hvac-engineer',
    role_name: 'HVAC Engineer',
    description: 'Design heating, ventilation, and air conditioning systems',
    required_skills: [
      { name: 'HVAC Design', priority: 'high' },
      { name: 'AutoCAD', priority: 'high' },
      { name: 'Revit MEP', priority: 'high' },
      { name: 'Thermodynamics', priority: 'high' },
      { name: 'Fluid Mechanics', priority: 'high' },
      { name: 'Heat Transfer', priority: 'high' },
      { name: 'Energy Audit', priority: 'medium' },
      { name: 'Building Codes', priority: 'medium' },
      { name: 'Refrigeration', priority: 'medium' },
      { name: 'Project Management', priority: 'low' }
    ],
    priority_skills: ['HVAC Design', 'Thermodynamics', 'Revit MEP', 'Fluid Mechanics', 'AutoCAD']
  },
  {
    id: 'quality-engineer',
    role_name: 'Quality Assurance Engineer',
    description: 'Ensure product quality through testing, inspection, and process improvement',
    required_skills: [
      { name: 'Six Sigma', priority: 'high' },
      { name: 'ISO Standards', priority: 'high' },
      { name: 'Quality Control', priority: 'high' },
      { name: 'Statistical Process Control', priority: 'high' },
      { name: 'Root Cause Analysis', priority: 'high' },
      { name: 'Lean Manufacturing', priority: 'medium' },
      { name: 'Metrology', priority: 'medium' },
      { name: 'Failure Analysis', priority: 'medium' },
      { name: 'SAP/ERP', priority: 'medium' },
      { name: 'GD&T', priority: 'low' }
    ],
    priority_skills: ['Six Sigma', 'ISO Standards', 'Quality Control', 'Statistical Process Control']
  },

  // ======= More Electrical Roles =======
  {
    id: 'control-systems-engineer',
    role_name: 'Control Systems Engineer',
    description: 'Design and implement automatic control systems for industrial processes',
    required_skills: [
      { name: 'Control Systems', priority: 'high' },
      { name: 'MATLAB/Simulink', priority: 'high' },
      { name: 'PLC Programming', priority: 'high' },
      { name: 'SCADA Systems', priority: 'high' },
      { name: 'Instrumentation', priority: 'high' },
      { name: 'Process Automation', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'DCS (Distributed Control)', priority: 'medium' },
      { name: 'Industrial Communication', priority: 'medium' },
      { name: 'Safety Systems', priority: 'low' }
    ],
    priority_skills: ['Control Systems', 'MATLAB/Simulink', 'PLC Programming', 'SCADA Systems', 'Instrumentation']
  },
  {
    id: 'instrumentation-engineer',
    role_name: 'Instrumentation Engineer',
    description: 'Design and maintain measurement and control instruments',
    required_skills: [
      { name: 'Instrumentation', priority: 'high' },
      { name: 'Sensors & Transducers', priority: 'high' },
      { name: 'PLC Programming', priority: 'high' },
      { name: 'SCADA Systems', priority: 'medium' },
      { name: 'Circuit Design', priority: 'high' },
      { name: 'Calibration', priority: 'high' },
      { name: 'Signal Conditioning', priority: 'medium' },
      { name: 'P&ID', priority: 'medium' },
      { name: 'AutoCAD', priority: 'medium' },
      { name: 'Industrial Safety', priority: 'low' }
    ],
    priority_skills: ['Instrumentation', 'Sensors & Transducers', 'PLC Programming', 'Circuit Design', 'Calibration']
  },
  {
    id: 'renewable-energy-engineer',
    role_name: 'Renewable Energy Engineer',
    description: 'Design solar, wind, and other renewable energy systems',
    required_skills: [
      { name: 'Renewable Energy', priority: 'high' },
      { name: 'Solar PV Design', priority: 'high' },
      { name: 'Power Systems Analysis', priority: 'high' },
      { name: 'MATLAB/Simulink', priority: 'medium' },
      { name: 'AutoCAD', priority: 'medium' },
      { name: 'PVsyst/SAM', priority: 'high' },
      { name: 'Energy Storage', priority: 'medium' },
      { name: 'Grid Integration', priority: 'high' },
      { name: 'Project Management', priority: 'medium' },
      { name: 'Environmental Compliance', priority: 'low' }
    ],
    priority_skills: ['Renewable Energy', 'Solar PV Design', 'Power Systems Analysis', 'Grid Integration']
  },

  // ======= More ECE Roles =======
  {
    id: 'telecom-engineer',
    role_name: 'Telecom Engineer',
    description: 'Design and maintain telecommunication networks and systems',
    required_skills: [
      { name: 'Networking', priority: 'high' },
      { name: 'Wireless Communication', priority: 'high' },
      { name: '5G/LTE', priority: 'high' },
      { name: 'Signal Processing', priority: 'high' },
      { name: 'RF Design', priority: 'medium' },
      { name: 'Network Protocols', priority: 'high' },
      { name: 'Python', priority: 'medium' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'Fiber Optics', priority: 'medium' },
      { name: 'Network Security', priority: 'low' }
    ],
    priority_skills: ['Wireless Communication', '5G/LTE', 'Signal Processing', 'Network Protocols', 'Networking']
  },
  {
    id: 'iot-architect',
    role_name: 'IoT Solutions Architect',
    description: 'Design end-to-end IoT systems connecting hardware, cloud, and applications',
    required_skills: [
      { name: 'IoT', priority: 'high' },
      { name: 'Arduino/Raspberry Pi', priority: 'high' },
      { name: 'Python', priority: 'high' },
      { name: 'AWS/GCP/Azure IoT', priority: 'high' },
      { name: 'MQTT/CoAP', priority: 'high' },
      { name: 'Embedded C', priority: 'medium' },
      { name: 'Networking', priority: 'medium' },
      { name: 'Data Analytics', priority: 'medium' },
      { name: 'Security', priority: 'medium' },
      { name: 'Edge Computing', priority: 'low' }
    ],
    priority_skills: ['IoT', 'Arduino/Raspberry Pi', 'Python', 'AWS/GCP/Azure IoT', 'MQTT/CoAP']
  },

  // ======= More Civil Roles =======
  {
    id: 'environmental-engineer',
    role_name: 'Environmental Engineer',
    description: 'Design solutions for environmental challenges like water treatment and waste management',
    required_skills: [
      { name: 'Environmental Impact Assessment', priority: 'high' },
      { name: 'Water Treatment', priority: 'high' },
      { name: 'Waste Management', priority: 'high' },
      { name: 'AutoCAD', priority: 'medium' },
      { name: 'GIS/Remote Sensing', priority: 'high' },
      { name: 'Environmental Laws', priority: 'high' },
      { name: 'Air Quality Monitoring', priority: 'medium' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'Sustainability', priority: 'medium' },
      { name: 'Soil Mechanics', priority: 'low' }
    ],
    priority_skills: ['Environmental Impact Assessment', 'Water Treatment', 'GIS/Remote Sensing', 'Environmental Laws']
  },
  {
    id: 'transportation-engineer',
    role_name: 'Transportation Engineer',
    description: 'Plan and design transportation systems including roads, railways, and highways',
    required_skills: [
      { name: 'Transportation Planning', priority: 'high' },
      { name: 'Traffic Engineering', priority: 'high' },
      { name: 'AutoCAD', priority: 'high' },
      { name: 'Highway Design', priority: 'high' },
      { name: 'GIS/Remote Sensing', priority: 'medium' },
      { name: 'Surveying', priority: 'high' },
      { name: 'Project Management', priority: 'medium' },
      { name: 'STAAD Pro', priority: 'medium' },
      { name: 'Urban Planning', priority: 'medium' },
      { name: 'Geotechnical Knowledge', priority: 'low' }
    ],
    priority_skills: ['Transportation Planning', 'Traffic Engineering', 'Highway Design', 'AutoCAD', 'Surveying']
  },

  // ======= More Chemical Roles =======
  {
    id: 'chemical-rd-scientist',
    role_name: 'R&D Scientist (Chemical)',
    description: 'Research and develop new chemical products, materials, and formulations',
    required_skills: [
      { name: 'Chemical Analysis', priority: 'high' },
      { name: 'Lab Techniques', priority: 'high' },
      { name: 'Research Methodology', priority: 'high' },
      { name: 'Material Science', priority: 'high' },
      { name: 'Quality Control', priority: 'medium' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'Statistics', priority: 'medium' },
      { name: 'Scientific Writing', priority: 'medium' },
      { name: 'Process Safety', priority: 'medium' },
      { name: 'Patent Knowledge', priority: 'low' }
    ],
    priority_skills: ['Chemical Analysis', 'Lab Techniques', 'Research Methodology', 'Material Science']
  },
  {
    id: 'environmental-health-safety',
    role_name: 'EHS Engineer',
    description: 'Manage environment, health, and safety compliance in industries',
    required_skills: [
      { name: 'Safety Management', priority: 'high' },
      { name: 'Environmental Compliance', priority: 'high' },
      { name: 'Risk Assessment', priority: 'high' },
      { name: 'ISO 14001/OHSAS', priority: 'high' },
      { name: 'Hazard Analysis', priority: 'high' },
      { name: 'Fire Safety', priority: 'medium' },
      { name: 'Waste Management', priority: 'medium' },
      { name: 'Industrial Hygiene', priority: 'medium' },
      { name: 'Audit & Inspection', priority: 'medium' },
      { name: 'First Aid/Emergency', priority: 'low' }
    ],
    priority_skills: ['Safety Management', 'Environmental Compliance', 'Risk Assessment', 'ISO 14001/OHSAS']
  },

  // ======= More Biotech Roles =======
  {
    id: 'biomedical-engineer',
    role_name: 'Biomedical Engineer',
    description: 'Design medical devices, equipment, and healthcare technology',
    required_skills: [
      { name: 'Biomedical Instrumentation', priority: 'high' },
      { name: 'Medical Device Design', priority: 'high' },
      { name: 'MATLAB', priority: 'medium' },
      { name: 'Signal Processing', priority: 'medium' },
      { name: 'Biomechanics', priority: 'high' },
      { name: 'Regulatory Standards (FDA)', priority: 'high' },
      { name: 'Lab Techniques', priority: 'medium' },
      { name: 'Python', priority: 'medium' },
      { name: 'AutoCAD/SolidWorks', priority: 'medium' },
      { name: 'Clinical Trials Knowledge', priority: 'low' }
    ],
    priority_skills: ['Biomedical Instrumentation', 'Medical Device Design', 'Biomechanics', 'Regulatory Standards (FDA)']
  },
  {
    id: 'clinical-research',
    role_name: 'Clinical Research Associate',
    description: 'Manage and monitor clinical trials for pharmaceuticals and biotechnology',
    required_skills: [
      { name: 'Clinical Trial Management', priority: 'high' },
      { name: 'GCP (Good Clinical Practice)', priority: 'high' },
      { name: 'Medical Writing', priority: 'high' },
      { name: 'Pharmacology', priority: 'high' },
      { name: 'Biostatistics', priority: 'high' },
      { name: 'Regulatory Affairs', priority: 'medium' },
      { name: 'Data Management', priority: 'medium' },
      { name: 'SAS/SPSS', priority: 'medium' },
      { name: 'Ethics & Compliance', priority: 'medium' },
      { name: 'Research Methodology', priority: 'medium' }
    ],
    priority_skills: ['Clinical Trial Management', 'GCP (Good Clinical Practice)', 'Pharmacology', 'Biostatistics']
  },
  {
    id: 'pharma-production',
    role_name: 'Pharmaceutical Production Manager',
    description: 'Oversee pharmaceutical manufacturing and ensure GMP compliance',
    required_skills: [
      { name: 'GMP (Good Manufacturing Practice)', priority: 'high' },
      { name: 'Quality Control', priority: 'high' },
      { name: 'Process Validation', priority: 'high' },
      { name: 'Pharmaceutical Technology', priority: 'high' },
      { name: 'Batch Manufacturing', priority: 'high' },
      { name: 'Regulatory Compliance', priority: 'high' },
      { name: 'Equipment Qualification', priority: 'medium' },
      { name: 'Documentation (SOP)', priority: 'medium' },
      { name: 'Supply Chain', priority: 'medium' },
      { name: 'Six Sigma', priority: 'low' }
    ],
    priority_skills: ['GMP (Good Manufacturing Practice)', 'Quality Control', 'Process Validation', 'Pharmaceutical Technology']
  }
];

/**
 * All available skills for student selection
 * Aggregated from all roles for the skill picker
 */
export const allSkills = [
  // Programming Languages
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C',
  'Go',
  'Rust',
  'R',
  'Swift',
  'Kotlin',
  
  // Frontend
  'HTML',
  'CSS',
  'React',
  'Vue.js',
  'Angular',
  'Next.js',
  'Tailwind CSS',
  'Bootstrap',
  'Sass/SCSS',
  'Responsive Design',
  'Webpack/Vite',
  
  // Backend
  'Node.js',
  'Express.js',
  'Django',
  'Flask',
  'Spring Boot',
  'FastAPI',
  'GraphQL',
  'REST APIs',
  
  // Databases
  'SQL',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Firebase',
  
  // DevOps & Cloud
  'Git',
  'Docker',
  'Kubernetes',
  'AWS/GCP/Azure',
  'Linux',
  'CI/CD',
  'Terraform',
  'Networking',
  'Security',
  
  // Data Science & ML
  'Machine Learning',
  'Deep Learning',
  'TensorFlow/PyTorch',
  'Pandas',
  'NumPy',
  'Scikit-learn',
  'Data Visualization',
  'Statistics',
  'Mathematics',
  'NLP',
  'Computer Vision',
  'Data Cleaning',
  'A/B Testing',
  
  // Mechanical & Manufacturing
  'AutoCAD',
  'SolidWorks',
  'CATIA',
  'GD&T',
  'FEA Analysis',
  'Material Science',
  'Thermodynamics',
  'Manufacturing Processes',
  '3D Printing',
  'Lean Manufacturing',
  'Six Sigma',
  'CNC Programming',
  'Quality Control',
  
  // Electrical & Electronics
  'MATLAB',
  'Circuit Design',
  'Power Systems Analysis',
  'PLC Programming',
  'Embedded C',
  'Microcontrollers',
  'RTOS',
  'Arduino/Raspberry Pi',
  'PCB Design',
  'VHDL/Verilog',
  'FPGA',
  'IoT',
  'Signal Processing',
  'Control Systems',
  'ROS',
  
  // Civil Engineering
  'STAAD Pro',
  'ETABS',
  'Revit',
  'Structural Analysis',
  'Project Management',
  'Surveying',
  'Cost Estimation',
  
  // Chemical & Biotech
  'Aspen Plus/HYSYS',
  'Process Simulation',
  'Bioinformatics',
  'Molecular Biology',
  'Lab Techniques',
  
  // Tools & Others
  'Excel',
  'Power BI/Tableau',
  'Google Analytics',
  'Testing (Jest)',
  'Authentication (JWT)',
  'UI/UX Design',
  'Agile/Scrum',
  'Problem Solving',
  'Data Structures',
  'Algorithms',
  'SAP/ERP'
];

/**
 * Branch options for students
 */
export const branches = [
  // Core Engineering
  'Computer Science Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  // Specialised Tech
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Cyber Security',
  'Cloud Computing',
  'Internet of Things (IoT)',
  'Robotics & Automation',
  // Other Engineering
  'Aerospace Engineering',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Biotechnology',
  'Environmental Engineering',
  'Industrial Engineering',
  'Instrumentation Engineering',
  'Marine Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Production Engineering',
  'Textile Engineering',
  // Non-Engineering / Other
  'Mathematics & Computing',
  'Physics',
  'MCA (Computer Applications)',
  'BCA (Computer Applications)',
  'Other',
];

/**
 * Year options for students
 */
export const years = [1, 2, 3, 4];

/**
 * Graduation / Passout year options
 */
export const passoutYears = [
  2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032
];

export default industryRoles;

