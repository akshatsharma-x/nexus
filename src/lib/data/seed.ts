import type {
  User, LearnerProfile, Skill, SkillMastery, Goal, LearningResource,
  Course, Project, Assessment, LearningPath, PathNode, Progress,
  Recommendation, WeeklyActivity, Milestone, Badge, VerifiedSkill,
  SkillPassport, CareerRole, SkillGap, AIMessage,
  LearningBehavior, LearnerContext
} from '../types';

// ─── User ─────────────────────────────────────────────────────────────────────
export const CURRENT_USER: User = {
  id: 'user_akshat_sharma',
  name: 'Akshat Sharma',
  email: 'akshat.sharma@example.com',
  joinedAt: new Date('2024-01-15'),
  timezone: 'America/Los_Angeles',
  learningStyle: 'hands_on',
  weeklyHoursAvailable: 12,
  streakDays: 23,
  totalXP: 14850,
  level: 12,
};

export const LEARNER_PROFILE: LearnerProfile = {
  userId: 'user_akshat_sharma',
  currentRole: 'Frontend Developer',
  targetRole: 'ML Engineer',
  yearsOfExperience: 3,
  educationLevel: 'bachelor',
  strengths: ['JavaScript', 'React', 'CSS', 'Problem Solving', 'Communication'],
  weaknesses: ['Mathematics', 'Statistics', 'System Design'],
  interests: ['AI/ML', 'Data Visualization', 'Developer Tools', 'Open Source'],
  preferredResourceTypes: ['video', 'interactive', 'project'],
  learningVelocity: 1.3,
  completionRate: 0.78,
  engagementScore: 82,
  lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

// ─── Skills Database ──────────────────────────────────────────────────────────
export const SKILLS: Skill[] = [
  // Programming Languages
  {
    id: 'sk_python', name: 'Python', slug: 'python', category: 'Programming', subcategory: 'Languages',
    description: 'General-purpose programming language essential for ML/AI development.',
    color: '#3b82f6', prerequisites: [], related: ['sk_numpy', 'sk_pandas', 'sk_ml_fundamentals'],
    demandScore: 98, difficulty: 2, estimatedHoursToLearn: 80, tags: ['backend', 'ml', 'scripting'],
  },
  {
    id: 'sk_javascript', name: 'JavaScript', slug: 'javascript', category: 'Programming', subcategory: 'Languages',
    description: 'The language of the web — essential for frontend and Node.js development.',
    color: '#f59e0b', prerequisites: [], related: ['sk_typescript', 'sk_react', 'sk_nodejs'],
    demandScore: 96, difficulty: 2, estimatedHoursToLearn: 100, tags: ['frontend', 'backend', 'web'],
  },
  {
    id: 'sk_typescript', name: 'TypeScript', slug: 'typescript', category: 'Programming', subcategory: 'Languages',
    description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
    color: '#3b82f6', prerequisites: ['sk_javascript'], related: ['sk_react', 'sk_nodejs'],
    demandScore: 92, difficulty: 2, estimatedHoursToLearn: 40, tags: ['frontend', 'backend', 'types'],
  },
  {
    id: 'sk_sql', name: 'SQL', slug: 'sql', category: 'Data', subcategory: 'Databases',
    description: 'Structured Query Language for managing relational databases.',
    color: '#06b6d4', prerequisites: [], related: ['sk_postgres', 'sk_data_analysis'],
    demandScore: 90, difficulty: 2, estimatedHoursToLearn: 60, tags: ['database', 'data', 'backend'],
  },
  // ML & AI
  {
    id: 'sk_ml_fundamentals', name: 'ML Fundamentals', slug: 'ml-fundamentals', category: 'Machine Learning',
    description: 'Core concepts of machine learning: supervised, unsupervised, and reinforcement learning.',
    color: '#8b5cf6', prerequisites: ['sk_python', 'sk_linear_algebra', 'sk_statistics'],
    related: ['sk_deep_learning', 'sk_sklearn', 'sk_feature_engineering'],
    demandScore: 94, difficulty: 3, estimatedHoursToLearn: 120, tags: ['ml', 'ai', 'modeling'],
  },
  {
    id: 'sk_deep_learning', name: 'Deep Learning', slug: 'deep-learning', category: 'Machine Learning',
    description: 'Neural networks, backpropagation, CNNs, RNNs, Transformers.',
    color: '#7c3aed', prerequisites: ['sk_ml_fundamentals', 'sk_linear_algebra', 'sk_calculus'],
    related: ['sk_pytorch', 'sk_tensorflow', 'sk_nlp', 'sk_computer_vision'],
    demandScore: 95, difficulty: 4, estimatedHoursToLearn: 200, tags: ['deep-learning', 'neural-networks', 'ai'],
  },
  {
    id: 'sk_nlp', name: 'Natural Language Processing', slug: 'nlp', category: 'Machine Learning',
    description: 'Processing and understanding human language using ML techniques.',
    color: '#06b6d4', prerequisites: ['sk_deep_learning', 'sk_python'],
    related: ['sk_transformers', 'sk_llm_engineering'],
    demandScore: 97, difficulty: 4, estimatedHoursToLearn: 150, tags: ['nlp', 'text', 'language'],
  },
  {
    id: 'sk_llm_engineering', name: 'LLM Engineering', slug: 'llm-engineering', category: 'Machine Learning',
    description: 'Building applications with large language models: prompting, fine-tuning, RAG.',
    color: '#10b981', prerequisites: ['sk_nlp', 'sk_python', 'sk_api_design'],
    related: ['sk_ml_ops', 'sk_vector_databases'],
    demandScore: 99, difficulty: 4, estimatedHoursToLearn: 100, tags: ['llm', 'ai', 'generative'],
  },
  // Mathematics
  {
    id: 'sk_linear_algebra', name: 'Linear Algebra', slug: 'linear-algebra', category: 'Mathematics',
    description: 'Vectors, matrices, eigenvalues — the mathematical backbone of ML.',
    color: '#f43f5e', prerequisites: [], related: ['sk_ml_fundamentals', 'sk_deep_learning'],
    demandScore: 85, difficulty: 3, estimatedHoursToLearn: 80, tags: ['math', 'ml-foundation'],
  },
  {
    id: 'sk_statistics', name: 'Statistics & Probability', slug: 'statistics', category: 'Mathematics',
    description: 'Distributions, hypothesis testing, Bayesian thinking, and statistical inference.',
    color: '#f59e0b', prerequisites: [], related: ['sk_ml_fundamentals', 'sk_data_analysis'],
    demandScore: 88, difficulty: 3, estimatedHoursToLearn: 90, tags: ['math', 'data', 'ml-foundation'],
  },
  {
    id: 'sk_calculus', name: 'Calculus', slug: 'calculus', category: 'Mathematics',
    description: 'Derivatives, integrals, and gradient calculus for optimization.',
    color: '#ec4899', prerequisites: [], related: ['sk_deep_learning', 'sk_ml_fundamentals'],
    demandScore: 80, difficulty: 3, estimatedHoursToLearn: 80, tags: ['math', 'optimization'],
  },
  // Data
  {
    id: 'sk_numpy', name: 'NumPy', slug: 'numpy', category: 'Data', subcategory: 'Libraries',
    description: 'Numerical computing with Python arrays and mathematical functions.',
    color: '#3b82f6', prerequisites: ['sk_python'], related: ['sk_pandas', 'sk_ml_fundamentals'],
    demandScore: 88, difficulty: 2, estimatedHoursToLearn: 30, tags: ['python', 'data', 'numerical'],
  },
  {
    id: 'sk_pandas', name: 'Pandas', slug: 'pandas', category: 'Data', subcategory: 'Libraries',
    description: 'Data manipulation and analysis library for Python.',
    color: '#6366f1', prerequisites: ['sk_python', 'sk_numpy'], related: ['sk_data_analysis', 'sk_sql'],
    demandScore: 89, difficulty: 2, estimatedHoursToLearn: 40, tags: ['python', 'data', 'analysis'],
  },
  {
    id: 'sk_data_analysis', name: 'Data Analysis', slug: 'data-analysis', category: 'Data',
    description: 'Exploratory data analysis, feature engineering, and data storytelling.',
    color: '#06b6d4', prerequisites: ['sk_pandas', 'sk_statistics', 'sk_sql'],
    related: ['sk_data_viz', 'sk_ml_fundamentals'],
    demandScore: 91, difficulty: 3, estimatedHoursToLearn: 80, tags: ['data', 'analysis', 'eda'],
  },
  // Frontend (current skills)
  {
    id: 'sk_react', name: 'React', slug: 'react', category: 'Frontend', subcategory: 'Frameworks',
    description: 'Component-based UI library for building interactive web applications.',
    color: '#06b6d4', prerequisites: ['sk_javascript'], related: ['sk_typescript', 'sk_nextjs'],
    demandScore: 94, difficulty: 2, estimatedHoursToLearn: 80, tags: ['frontend', 'ui', 'components'],
  },
  {
    id: 'sk_nextjs', name: 'Next.js', slug: 'nextjs', category: 'Frontend', subcategory: 'Frameworks',
    description: 'React framework for production with SSR, SSG, and App Router.',
    color: '#f0f0ff', prerequisites: ['sk_react', 'sk_typescript'], related: ['sk_react', 'sk_nodejs'],
    demandScore: 90, difficulty: 3, estimatedHoursToLearn: 60, tags: ['frontend', 'fullstack', 'ssr'],
  },
  // ML Frameworks
  {
    id: 'sk_pytorch', name: 'PyTorch', slug: 'pytorch', category: 'Machine Learning', subcategory: 'Frameworks',
    description: 'Deep learning framework with dynamic computation graphs.',
    color: '#ef4444', prerequisites: ['sk_deep_learning', 'sk_numpy'], related: ['sk_deep_learning'],
    demandScore: 93, difficulty: 3, estimatedHoursToLearn: 100, tags: ['pytorch', 'deep-learning', 'ml'],
  },
  {
    id: 'sk_sklearn', name: 'Scikit-Learn', slug: 'scikit-learn', category: 'Machine Learning', subcategory: 'Frameworks',
    description: 'Classical ML algorithms: regression, classification, clustering, preprocessing.',
    color: '#f59e0b', prerequisites: ['sk_python', 'sk_numpy', 'sk_pandas'],
    related: ['sk_ml_fundamentals', 'sk_data_analysis'],
    demandScore: 87, difficulty: 2, estimatedHoursToLearn: 60, tags: ['sklearn', 'ml', 'classical'],
  },
  // Infrastructure
  {
    id: 'sk_ml_ops', name: 'MLOps', slug: 'mlops', category: 'Infrastructure',
    description: 'Deploying, monitoring, and maintaining ML models in production.',
    color: '#10b981', prerequisites: ['sk_ml_fundamentals', 'sk_docker', 'sk_python'],
    related: ['sk_docker', 'sk_kubernetes', 'sk_cloud'],
    demandScore: 90, difficulty: 4, estimatedHoursToLearn: 120, tags: ['mlops', 'deployment', 'production'],
  },
  {
    id: 'sk_docker', name: 'Docker', slug: 'docker', category: 'Infrastructure',
    description: 'Containerization for reproducible, portable application environments.',
    color: '#3b82f6', prerequisites: [], related: ['sk_ml_ops', 'sk_kubernetes'],
    demandScore: 91, difficulty: 2, estimatedHoursToLearn: 40, tags: ['containers', 'devops', 'infrastructure'],
  },
  {
    id: 'sk_api_design', name: 'API Design', slug: 'api-design', category: 'Backend',
    description: 'RESTful and GraphQL API design patterns, authentication, and best practices.',
    color: '#8b5cf6', prerequisites: ['sk_javascript'], related: ['sk_nodejs', 'sk_python'],
    demandScore: 89, difficulty: 3, estimatedHoursToLearn: 60, tags: ['api', 'backend', 'rest'],
  },
  {
    id: 'sk_feature_engineering', name: 'Feature Engineering', slug: 'feature-engineering', category: 'Machine Learning',
    description: 'Transforming raw data into meaningful features for ML models.',
    color: '#a78bfa', prerequisites: ['sk_data_analysis', 'sk_ml_fundamentals'],
    related: ['sk_ml_fundamentals', 'sk_data_analysis'],
    demandScore: 85, difficulty: 3, estimatedHoursToLearn: 60, tags: ['features', 'ml', 'data'],
  },
  {
    id: 'sk_data_viz', name: 'Data Visualization', slug: 'data-viz', category: 'Data',
    description: 'Creating compelling visualizations with Matplotlib, Seaborn, Plotly, and D3.',
    color: '#ec4899', prerequisites: ['sk_pandas', 'sk_statistics'],
    related: ['sk_data_analysis'],
    demandScore: 82, difficulty: 2, estimatedHoursToLearn: 50, tags: ['visualization', 'data', 'charts'],
  },
  {
    id: 'sk_vector_databases', name: 'Vector Databases', slug: 'vector-databases', category: 'Data',
    description: 'Embeddings storage, similarity search, and retrieval-augmented generation.',
    color: '#06b6d4', prerequisites: ['sk_llm_engineering', 'sk_python'],
    related: ['sk_llm_engineering', 'sk_ml_ops'],
    demandScore: 95, difficulty: 3, estimatedHoursToLearn: 40, tags: ['vectors', 'rag', 'databases'],
  },
];

// ─── Skill Mastery (Akshat's current state) ───────────────────────────────────
export const SKILL_MASTERIES: SkillMastery[] = [
  { skillId: 'sk_javascript', level: 'expert', score: 88, evidence: [], lastPracticed: new Date(), trending: 'stable', confidenceScore: 92 },
  { skillId: 'sk_typescript', level: 'advanced', score: 78, evidence: [], lastPracticed: new Date(), trending: 'up', confidenceScore: 85 },
  { skillId: 'sk_react', level: 'expert', score: 85, evidence: [], lastPracticed: new Date(), trending: 'stable', confidenceScore: 90 },
  { skillId: 'sk_nextjs', level: 'advanced', score: 74, evidence: [], lastPracticed: new Date(), trending: 'up', confidenceScore: 80 },
  { skillId: 'sk_python', level: 'intermediate', score: 55, evidence: [], lastPracticed: new Date(Date.now() - 3 * 24 * 3600000), trending: 'up', confidenceScore: 75 },
  { skillId: 'sk_sql', level: 'intermediate', score: 62, evidence: [], lastPracticed: new Date(Date.now() - 5 * 24 * 3600000), trending: 'stable', confidenceScore: 78 },
  { skillId: 'sk_linear_algebra', level: 'beginner', score: 30, evidence: [], lastPracticed: new Date(Date.now() - 10 * 24 * 3600000), trending: 'up', confidenceScore: 65 },
  { skillId: 'sk_statistics', level: 'beginner', score: 28, evidence: [], lastPracticed: new Date(Date.now() - 12 * 24 * 3600000), trending: 'stable', confidenceScore: 60 },
  { skillId: 'sk_numpy', level: 'beginner', score: 25, evidence: [], lastPracticed: new Date(Date.now() - 7 * 24 * 3600000), trending: 'up', confidenceScore: 65 },
  { skillId: 'sk_pandas', level: 'novice', score: 12, evidence: [], lastPracticed: new Date(Date.now() - 14 * 24 * 3600000), trending: 'stable', confidenceScore: 50 },
  { skillId: 'sk_docker', level: 'beginner', score: 35, evidence: [], lastPracticed: new Date(Date.now() - 20 * 24 * 3600000), trending: 'stable', confidenceScore: 70 },
  { skillId: 'sk_api_design', level: 'intermediate', score: 60, evidence: [], lastPracticed: new Date(), trending: 'stable', confidenceScore: 80 },
];

// ─── Goal ─────────────────────────────────────────────────────────────────────
export const ACTIVE_GOAL: Goal = {
  id: 'goal_ml_engineer',
  userId: 'user_akshat_sharma',
  title: 'Become an ML Engineer',
  description: 'Transition from Frontend Developer to ML Engineer role at a top tech company within 12 months.',
  targetRole: 'ml_engineer',
  targetDate: new Date('2027-03-01'),
  status: 'active',
  requiredSkills: [
    { skillId: 'sk_python', requiredLevel: 'advanced' },
    { skillId: 'sk_ml_fundamentals', requiredLevel: 'advanced' },
    { skillId: 'sk_deep_learning', requiredLevel: 'intermediate' },
    { skillId: 'sk_pytorch', requiredLevel: 'intermediate' },
    { skillId: 'sk_linear_algebra', requiredLevel: 'intermediate' },
    { skillId: 'sk_statistics', requiredLevel: 'intermediate' },
    { skillId: 'sk_sql', requiredLevel: 'advanced' },
    { skillId: 'sk_ml_ops', requiredLevel: 'beginner' },
    { skillId: 'sk_data_analysis', requiredLevel: 'intermediate' },
  ],
  progressPercent: 31,
  createdAt: new Date('2024-01-20'),
};

// ─── Learning Resources ───────────────────────────────────────────────────────
export const RESOURCES: LearningResource[] = [
  {
    id: 'res_fast_ai', title: 'Practical Deep Learning for Coders', type: 'course',
    provider: 'fast.ai', url: '#', description: 'Top-down practical approach to deep learning.',
    skillIds: ['sk_deep_learning', 'sk_pytorch', 'sk_python'],
    difficultyLevel: 3, estimatedHours: 60, rating: 4.9, reviewCount: 12400,
    isFree: true, tags: ['deep-learning', 'pytorch', 'practical'],
    prerequisites: ['sk_python'], language: 'English', updatedAt: new Date('2024-08-01'),
  },
  {
    id: 'res_3b1b_linear', title: 'Essence of Linear Algebra', type: 'video',
    provider: '3Blue1Brown', url: '#', description: 'Visual, intuitive introduction to linear algebra concepts.',
    skillIds: ['sk_linear_algebra'],
    difficultyLevel: 2, estimatedHours: 4, rating: 5.0, reviewCount: 8900,
    isFree: true, tags: ['linear-algebra', 'math', 'visual'],
    prerequisites: [], language: 'English', updatedAt: new Date('2023-01-01'),
  },
  {
    id: 'res_statquest', title: 'StatQuest with Josh Starmer', type: 'video',
    provider: 'YouTube', url: '#', description: 'Statistics and ML concepts explained clearly.',
    skillIds: ['sk_statistics', 'sk_ml_fundamentals'],
    difficultyLevel: 2, estimatedHours: 30, rating: 4.8, reviewCount: 5600,
    isFree: true, tags: ['statistics', 'ml', 'explained'],
    prerequisites: [], language: 'English', updatedAt: new Date('2024-05-01'),
  },
  {
    id: 'res_kaggle_pandas', title: 'Pandas — Kaggle Learn', type: 'interactive',
    provider: 'Kaggle', url: '#', description: 'Hands-on Pandas course with real datasets.',
    skillIds: ['sk_pandas', 'sk_data_analysis'],
    difficultyLevel: 2, estimatedHours: 8, rating: 4.7, reviewCount: 23000,
    isFree: true, tags: ['pandas', 'data', 'kaggle'],
    prerequisites: ['sk_python'], language: 'English', updatedAt: new Date('2024-03-01'),
  },
  {
    id: 'res_cs229', title: 'CS229: Machine Learning (Stanford)', type: 'course',
    provider: 'Stanford', url: '#', description: "Andrew Ng's foundational ML course.",
    skillIds: ['sk_ml_fundamentals', 'sk_statistics', 'sk_linear_algebra'],
    difficultyLevel: 4, estimatedHours: 110, rating: 4.8, reviewCount: 45000,
    isFree: true, tags: ['ml', 'stanford', 'theory'],
    prerequisites: ['sk_linear_algebra', 'sk_statistics', 'sk_python'], language: 'English', updatedAt: new Date('2023-09-01'),
  },
  {
    id: 'res_python_ml', title: 'Python Machine Learning (Book)', type: 'book',
    provider: "O'Reilly", url: '#', description: 'Comprehensive ML with Python and Scikit-Learn.',
    skillIds: ['sk_python', 'sk_ml_fundamentals', 'sk_sklearn'],
    difficultyLevel: 3, estimatedHours: 50, rating: 4.6, reviewCount: 3200,
    isFree: false, price: 49.99, tags: ['python', 'sklearn', 'book'],
    prerequisites: ['sk_python'], language: 'English', updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'res_llm_course', title: 'LLM Engineering: Building AI Applications', type: 'course',
    provider: 'DeepLearning.AI', url: '#', description: 'Build LLM-powered apps with RAG, agents, and fine-tuning.',
    skillIds: ['sk_llm_engineering', 'sk_nlp', 'sk_vector_databases'],
    difficultyLevel: 3, estimatedHours: 25, rating: 4.8, reviewCount: 18000,
    isFree: true, tags: ['llm', 'rag', 'agents'],
    prerequisites: ['sk_python', 'sk_deep_learning'], language: 'English', updatedAt: new Date('2024-07-01'),
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  {
    id: 'proj_sentiment', title: 'Sentiment Analyzer API',
    description: 'Build a REST API that analyzes sentiment of text using a fine-tuned BERT model. Deploy with FastAPI and Docker.',
    difficulty: 3, skillIds: ['sk_python', 'sk_nlp', 'sk_api_design', 'sk_docker'],
    estimatedHours: 20, type: 'guided', status: 'in_progress',
    tags: ['nlp', 'api', 'deployment'], xpReward: 800, mentorReview: true,
  },
  {
    id: 'proj_eda', title: 'Exploratory Data Analysis: NYC Taxi Trips',
    description: 'Perform a complete EDA on 1M+ NYC taxi trips dataset. Create interactive visualizations and surface 5 key insights.',
    difficulty: 2, skillIds: ['sk_pandas', 'sk_data_analysis', 'sk_data_viz', 'sk_statistics'],
    estimatedHours: 12, type: 'challenge', status: 'not_started',
    tags: ['eda', 'pandas', 'visualization'], xpReward: 500, mentorReview: false,
  },
  {
    id: 'proj_nn_scratch', title: 'Neural Network from Scratch',
    description: 'Implement a multi-layer perceptron using only NumPy. Train on MNIST to reach 97%+ accuracy.',
    difficulty: 4, skillIds: ['sk_deep_learning', 'sk_numpy', 'sk_linear_algebra', 'sk_calculus'],
    estimatedHours: 25, type: 'challenge', status: 'not_started',
    tags: ['deep-learning', 'numpy', 'from-scratch'], xpReward: 1200, mentorReview: true,
  },
  {
    id: 'proj_rag_app', title: 'RAG-Powered Document Q&A',
    description: 'Build a document question-answering system using RAG architecture, vector database, and a hosted LLM.',
    difficulty: 4, skillIds: ['sk_llm_engineering', 'sk_python', 'sk_vector_databases', 'sk_api_design'],
    estimatedHours: 30, type: 'guided', status: 'not_started',
    tags: ['rag', 'llm', 'vectors'], xpReward: 1500, mentorReview: true,
  },
  {
    id: 'proj_portfolio', title: 'ML Portfolio Website',
    description: 'Create a portfolio site showcasing your ML projects with interactive demos using your React skills.',
    difficulty: 2, skillIds: ['sk_react', 'sk_nextjs', 'sk_typescript'],
    estimatedHours: 15, type: 'solo', status: 'completed',
    completedAt: new Date('2024-02-10'),
    tags: ['portfolio', 'react', 'nextjs'], xpReward: 600, mentorReview: false,
  },
];

// ─── Assessments ──────────────────────────────────────────────────────────────
export const ASSESSMENTS: Assessment[] = [
  {
    id: 'asmnt_python_basics', title: 'Python Foundations Assessment',
    description: 'Test your knowledge of Python fundamentals: data types, control flow, functions, OOP.',
    type: 'quiz', skillIds: ['sk_python'], difficulty: 2,
    estimatedMinutes: 25, totalQuestions: 30, passingScore: 70, xpReward: 200, tags: ['python', 'basics'],
  },
  {
    id: 'asmnt_linear_algebra', title: 'Linear Algebra for ML',
    description: 'Vectors, matrices, dot products, eigenvalues, and their ML applications.',
    type: 'quiz', skillIds: ['sk_linear_algebra'], difficulty: 3,
    estimatedMinutes: 40, totalQuestions: 25, passingScore: 65, xpReward: 300, tags: ['math', 'linear-algebra'],
  },
  {
    id: 'asmnt_stats', title: 'Statistics & Probability Challenge',
    description: 'Distributions, hypothesis testing, p-values, and Bayesian basics.',
    type: 'quiz', skillIds: ['sk_statistics'], difficulty: 3,
    estimatedMinutes: 45, totalQuestions: 30, passingScore: 65, xpReward: 350, tags: ['statistics', 'probability'],
  },
  {
    id: 'asmnt_ml_concepts', title: 'ML Concepts Deep Dive',
    description: 'Supervised vs unsupervised, bias-variance tradeoff, regularization, model evaluation.',
    type: 'quiz', skillIds: ['sk_ml_fundamentals'], difficulty: 3,
    estimatedMinutes: 50, totalQuestions: 35, passingScore: 70, xpReward: 400, tags: ['ml', 'concepts'],
  },
  {
    id: 'asmnt_pandas_project', title: 'Pandas Data Wrangling Challenge',
    description: 'Complete 10 data manipulation tasks on a messy real-world dataset.',
    type: 'project', skillIds: ['sk_pandas', 'sk_data_analysis'], difficulty: 2,
    estimatedMinutes: 60, passingScore: 75, xpReward: 450, tags: ['pandas', 'data-wrangling'],
  },
];

// ─── Learning Path ────────────────────────────────────────────────────────────
export const ACTIVE_PATH: LearningPath = {
  id: 'path_ml_transition',
  userId: 'user_akshat_sharma',
  goalId: 'goal_ml_engineer',
  title: 'Frontend → ML Engineer Transition Path',
  description: 'A personalized journey leveraging your existing web skills while systematically building ML foundations.',
  estimatedTotalHours: 380,
  progressPercent: 28,
  recommendationReason: 'Optimized for your hands-on learning style, 12h/week availability, and existing JavaScript expertise as a Python bridge.',
  adaptationHistory: [
    {
      timestamp: new Date('2024-03-01'),
      reason: 'Assessment results showed stronger-than-expected statistics foundation.',
      changesApplied: ['Reduced statistics module depth', 'Added advanced probability track'],
      triggeredBy: 'assessment_result',
    },
    {
      timestamp: new Date('2024-04-15'),
      reason: 'You completed the Python module 40% faster than estimated.',
      changesApplied: ['Unlocked early access to NumPy/Pandas track', 'Added ML fundamentals preview'],
      triggeredBy: 'pace_change',
    },
  ],
  createdAt: new Date('2024-01-25'),
  lastAdaptedAt: new Date('2024-04-15'),
  nodes: [
    {
      id: 'node_python_core', order: 1, type: 'skill', skillId: 'sk_python',
      title: 'Python Mastery', description: 'Level up Python to Advanced — your entry into the ML ecosystem.',
      status: 'in_progress', estimatedHours: 40, xpReward: 600,
      unlockConditions: [], skillsGained: ['sk_python'],
      whyRecommended: 'Python is the lingua franca of ML. Your JavaScript background will make syntax transfer fast — focus on idioms and the data ecosystem.',
    },
    {
      id: 'node_linear_algebra', order: 2, type: 'resource', resourceId: 'res_3b1b_linear',
      title: 'Linear Algebra Foundations', description: 'Visual, intuitive mastery of the math backbone of ML.',
      status: 'in_progress', estimatedHours: 8, xpReward: 200,
      unlockConditions: [], skillsGained: ['sk_linear_algebra'],
      whyRecommended: '3Blue1Brown\'s visual style matches your visual learning preference. Completing this now will make deep learning click faster.',
    },
    {
      id: 'node_statistics', order: 3, type: 'resource', resourceId: 'res_statquest',
      title: 'Statistics & Probability', description: 'Statistical intuition through Josh Starmer\'s acclaimed series.',
      status: 'available', estimatedHours: 30, xpReward: 400,
      unlockConditions: ['node_linear_algebra'], skillsGained: ['sk_statistics'],
      whyRecommended: 'StatQuest uses the same intuition-first, visual-later approach as 3Blue1Brown. Consistent style reduces context switching.',
    },
    {
      id: 'node_numpy_pandas', order: 4, type: 'resource', resourceId: 'res_kaggle_pandas',
      title: 'NumPy + Pandas', description: 'The data toolkit every ML practitioner needs daily.',
      status: 'available', estimatedHours: 20, xpReward: 350,
      unlockConditions: ['node_python_core'], skillsGained: ['sk_numpy', 'sk_pandas'],
      whyRecommended: 'Kaggle\'s interactive notebooks let you learn by doing — perfectly matched to your hands-on style.',
    },
    {
      id: 'node_eda_project', order: 5, type: 'project', projectId: 'proj_eda',
      title: 'EDA Project: NYC Taxi', description: 'Apply Pandas and stats skills on real data.',
      status: 'locked', estimatedHours: 12, xpReward: 500,
      unlockConditions: ['node_numpy_pandas', 'node_statistics'], skillsGained: ['sk_data_analysis', 'sk_data_viz'],
      whyRecommended: 'Consolidates your Pandas and stats learning with real data. Strong portfolio piece for ML interviews.',
    },
    {
      id: 'node_ml_fundamentals', order: 6, type: 'resource', resourceId: 'res_python_ml',
      title: 'ML Fundamentals', description: 'Core algorithms, evaluation, and the ML workflow.',
      status: 'locked', estimatedHours: 50, xpReward: 700,
      unlockConditions: ['node_statistics', 'node_numpy_pandas'], skillsGained: ['sk_ml_fundamentals', 'sk_sklearn'],
      whyRecommended: 'Scikit-learn\'s scikit API is highly consistent — your pattern recognition from React component APIs will transfer.',
    },
    {
      id: 'node_ml_assessment', order: 7, type: 'assessment', assessmentId: 'asmnt_ml_concepts',
      title: 'ML Concepts Assessment', description: 'Validate your ML foundations before advancing to deep learning.',
      status: 'locked', estimatedHours: 1, xpReward: 400,
      unlockConditions: ['node_ml_fundamentals'], skillsGained: [],
      whyRecommended: 'Passing this assessment unlocks the deep learning track and certifies your ML foundations.',
    },
    {
      id: 'node_deep_learning', order: 8, type: 'resource', resourceId: 'res_fast_ai',
      title: 'Deep Learning (fast.ai)', description: 'Practical deep learning using the top-down approach.',
      status: 'locked', estimatedHours: 60, xpReward: 900,
      unlockConditions: ['node_ml_assessment'], skillsGained: ['sk_deep_learning', 'sk_pytorch'],
      whyRecommended: 'fast.ai\'s code-first approach aligns perfectly with your hands-on style. You\'ll build working models on day 1.',
    },
    {
      id: 'node_sentiment_project', order: 9, type: 'project', projectId: 'proj_sentiment',
      title: 'Sentiment Analyzer API', description: 'Deploy an NLP model as an API using your existing web skills.',
      status: 'in_progress', estimatedHours: 20, xpReward: 800,
      unlockConditions: ['node_deep_learning'], skillsGained: ['sk_nlp', 'sk_ml_ops'],
      whyRecommended: 'Bridges your existing API design skills with new ML skills — this is your first production ML system.',
    },
    {
      id: 'node_llm_engineering', order: 10, type: 'resource', resourceId: 'res_llm_course',
      title: 'LLM Engineering', description: 'Build production AI applications — the most in-demand ML skill right now.',
      status: 'locked', estimatedHours: 25, xpReward: 800,
      unlockConditions: ['node_sentiment_project'], skillsGained: ['sk_llm_engineering', 'sk_vector_databases'],
      whyRecommended: 'Your web development background gives you a massive advantage in building LLM apps vs pure ML engineers.',
    },
  ],
};

// ─── Milestones (declared before USER_PROGRESS) ──────────────────────────────
export const MILESTONES: Milestone[] = [
  { id: 'ms_streak_7', title: '7-Day Streak', description: 'Learned every day for a week', achievedAt: new Date('2024-02-01'), xpReward: 100, icon: '🔥', type: 'streak' },
  { id: 'ms_first_project', title: 'First Project', description: 'Completed your first project', achievedAt: new Date('2024-02-10'), xpReward: 200, icon: '🚀', type: 'project' },
  { id: 'ms_python_beginner', title: 'Python Beginner', description: 'Reached Beginner level in Python', achievedAt: new Date('2024-03-05'), xpReward: 150, icon: '🐍', type: 'skill' },
  { id: 'ms_streak_21', title: '21-Day Streak', description: 'Three weeks of daily learning', achievedAt: new Date('2024-04-20'), xpReward: 300, icon: '⚡', type: 'streak' },
  { id: 'ms_level_10', title: 'Level 10', description: 'Reached Level 10', achievedAt: new Date('2024-04-01'), xpReward: 500, icon: '🏆', type: 'level' },
  { id: 'ms_assessments_5', title: 'Assessment Ace', description: 'Passed 5 assessments', achievedAt: new Date('2024-03-20'), xpReward: 250, icon: '✅', type: 'assessment' },
];

// ─── Progress ─────────────────────────────────────────────────────────────────
export const USER_PROGRESS: Progress = {
  userId: 'user_akshat_sharma',
  totalXP: 14850,
  level: 12,
  streakDays: 23,
  longestStreak: 31,
  totalHoursLearned: 187,
  resourcesCompleted: 24,
  assessmentsPassed: 8,
  projectsCompleted: 3,
  skillsAcquired: 11,
  weeklyActivity: generateWeeklyActivity(),
  milestones: MILESTONES,
};

function generateWeeklyActivity(): WeeklyActivity[] {
  const weeks: WeeklyActivity[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const seed = i * 7 + 3;
    weeks.push({
      weekStart,
      hoursLearned: Math.round((Math.sin(seed * 0.7) * 3 + 7) * 10) / 10,
      xpEarned: Math.round(Math.sin(seed * 0.5) * 300 + 900),
      skillsProgressed: Math.max(0, Math.round(Math.sin(seed * 0.3) * 2 + 2)),
      resourcesCompleted: Math.max(0, Math.round(Math.sin(seed * 0.4) * 1.5 + 2)),
    });
  }
  return weeks;
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec_pandas_now', userId: 'user_akshat_sharma',
    type: 'resource', priority: 'urgent',
    title: 'Start Pandas now — it\'s your critical path bottleneck',
    description: 'Your current learning pace shows you\'ll need Pandas to unlock the EDA project, which unblocks ML Fundamentals. Delaying increases risk of missing your August target.',
    resourceId: 'res_kaggle_pandas', confidence: 0.91,
    reasons: [
      { type: 'skill_gap', description: 'Pandas mastery at Novice — required: Intermediate for path progress', weight: 0.4 },
      { type: 'goal_alignment', description: 'Direct prerequisite for EDA Project on your critical path', weight: 0.35 },
      { type: 'learning_style', description: 'Kaggle interactive notebooks match your hands-on preference', weight: 0.25 },
    ],
    dismissed: false, createdAt: new Date(),
  },
  {
    id: 'rec_assessment_python', userId: 'user_akshat_sharma',
    type: 'assessment', priority: 'high',
    title: 'Take Python Assessment to confirm your current level',
    description: 'You\'ve been learning Python for 6 weeks. An assessment will give the system more accurate skill evidence and may unlock advanced exercises.',
    assessmentId: 'asmnt_python_basics', confidence: 0.85,
    reasons: [
      { type: 'skill_gap', description: 'Current Python score based on learning activity, not assessment evidence', weight: 0.5 },
      { type: 'goal_alignment', description: 'Python must reach Advanced for your ML Engineer goal', weight: 0.5 },
    ],
    dismissed: false, createdAt: new Date(Date.now() - 2 * 24 * 3600000),
  },
  {
    id: 'rec_linear_algebra_video', userId: 'user_akshat_sharma',
    type: 'resource', priority: 'medium',
    title: 'Continue 3Blue1Brown Linear Algebra series',
    description: 'You\'re 3/15 videos in. Completing this series this week will keep you on the critical path toward deep learning.',
    resourceId: 'res_3b1b_linear', confidence: 0.78,
    reasons: [
      { type: 'prerequisite', description: 'Required before ML Fundamentals and Deep Learning', weight: 0.6 },
      { type: 'schedule_fit', description: 'Only 4h remaining — fits in 2 evening sessions', weight: 0.4 },
    ],
    dismissed: false, createdAt: new Date(Date.now() - 5 * 24 * 3600000),
  },
];

// ─── Skill Gaps ───────────────────────────────────────────────────────────────
export const SKILL_GAPS: SkillGap[] = [
  {
    skill: SKILLS.find(s => s.id === 'sk_ml_fundamentals')!,
    currentLevel: 'novice', requiredLevel: 'advanced',
    gapScore: 85, priority: 'critical', estimatedHoursToClose: 120,
    recommendations: ['res_python_ml', 'res_cs229'],
  },
  {
    skill: SKILLS.find(s => s.id === 'sk_deep_learning')!,
    currentLevel: 'novice', requiredLevel: 'intermediate',
    gapScore: 80, priority: 'critical', estimatedHoursToClose: 200,
    recommendations: ['res_fast_ai'],
  },
  {
    skill: SKILLS.find(s => s.id === 'sk_statistics')!,
    currentLevel: 'beginner', requiredLevel: 'intermediate',
    gapScore: 60, priority: 'high', estimatedHoursToClose: 60,
    recommendations: ['res_statquest'],
  },
  {
    skill: SKILLS.find(s => s.id === 'sk_linear_algebra')!,
    currentLevel: 'beginner', requiredLevel: 'intermediate',
    gapScore: 55, priority: 'high', estimatedHoursToClose: 50,
    recommendations: ['res_3b1b_linear'],
  },
  {
    skill: SKILLS.find(s => s.id === 'sk_pandas')!,
    currentLevel: 'novice', requiredLevel: 'intermediate',
    gapScore: 65, priority: 'high', estimatedHoursToClose: 30,
    recommendations: ['res_kaggle_pandas'],
  },
  {
    skill: SKILLS.find(s => s.id === 'sk_python')!,
    currentLevel: 'intermediate', requiredLevel: 'advanced',
    gapScore: 40, priority: 'medium', estimatedHoursToClose: 40,
    recommendations: ['res_python_ml'],
  },
];

// ─── Career Role ──────────────────────────────────────────────────────────────
export const ML_ENGINEER_ROLE: CareerRole = {
  id: 'ml_engineer',
  title: 'ML Engineer',
  description: 'Design, build, and deploy machine learning systems at scale. Bridge research and production.',
  averageSalary: { min: 140000, max: 220000, currency: 'USD' },
  demandTrend: 'rising',
  requiredSkills: [
    { skillId: 'sk_python', requiredLevel: 'advanced', critical: true },
    { skillId: 'sk_ml_fundamentals', requiredLevel: 'advanced', critical: true },
    { skillId: 'sk_deep_learning', requiredLevel: 'intermediate', critical: true },
    { skillId: 'sk_pytorch', requiredLevel: 'intermediate', critical: true },
    { skillId: 'sk_sql', requiredLevel: 'advanced', critical: false },
    { skillId: 'sk_ml_ops', requiredLevel: 'intermediate', critical: false },
    { skillId: 'sk_linear_algebra', requiredLevel: 'intermediate', critical: true },
    { skillId: 'sk_statistics', requiredLevel: 'intermediate', critical: true },
    { skillId: 'sk_docker', requiredLevel: 'intermediate', critical: false },
  ],
  niceToHaveSkills: ['sk_llm_engineering', 'sk_vector_databases', 'sk_nlp', 'sk_data_analysis'],
  typicalPath: ['Software Engineer', 'Data Analyst', 'ML Engineer', 'Senior ML Engineer', 'Staff ML Engineer'],
  companiesHiring: ['Google', 'Meta', 'OpenAI', 'Anthropic', 'Microsoft', 'Apple', 'Netflix', 'Stripe'],
  growthOutlook: '35% growth expected by 2026, driven by generative AI and LLM adoption.',
};

// ─── Badges ───────────────────────────────────────────────────────────────────
export const BADGES: Badge[] = [
  { id: 'badge_streak_7', name: 'Week Warrior', description: '7-day learning streak', icon: '🔥', category: 'streak', earnedAt: new Date('2024-02-01'), rarity: 'common' },
  { id: 'badge_first_project', name: 'Builder', description: 'Completed first project', icon: '🔨', category: 'completion', earnedAt: new Date('2024-02-10'), rarity: 'common' },
  { id: 'badge_python_lvl', name: 'Pythonista', description: 'Reached Intermediate Python', icon: '🐍', category: 'skill', earnedAt: new Date('2024-03-05'), rarity: 'uncommon' },
  { id: 'badge_streak_21', name: 'Consistency Master', description: '21-day streak achieved', icon: '⚡', category: 'streak', earnedAt: new Date('2024-04-20'), rarity: 'uncommon' },
  { id: 'badge_assessment_ace', name: 'Assessment Ace', description: 'Passed 5 assessments with 80%+ scores', icon: '✅', category: 'completion', earnedAt: new Date('2024-03-20'), rarity: 'rare' },
  { id: 'badge_level_10', name: 'Knowledge Seeker', description: 'Reached Level 10', icon: '🏆', category: 'completion', earnedAt: new Date('2024-04-01'), rarity: 'rare' },
];

// ─── Skill Passport ───────────────────────────────────────────────────────────
export const SKILL_PASSPORT: SkillPassport = {
  userId: 'user_akshat_sharma',
  version: '1.0',
  generatedAt: new Date(),
  verifiedSkills: [
    { skillId: 'sk_javascript', level: 'expert', score: 88, evidenceCount: 12, verifiedAt: new Date('2024-03-15'), issuedBy: 'NEXUS Assessment Engine', credentialId: 'NEXUS-JS-EXP-001' },
    { skillId: 'sk_react', level: 'expert', score: 85, evidenceCount: 9, verifiedAt: new Date('2024-03-20'), issuedBy: 'NEXUS Assessment Engine', credentialId: 'NEXUS-REACT-EXP-001' },
    { skillId: 'sk_typescript', level: 'advanced', score: 78, evidenceCount: 7, verifiedAt: new Date('2024-04-01'), issuedBy: 'NEXUS Assessment Engine', credentialId: 'NEXUS-TS-ADV-001' },
    { skillId: 'sk_python', level: 'intermediate', score: 55, evidenceCount: 5, verifiedAt: new Date('2024-04-10'), issuedBy: 'NEXUS Assessment Engine', credentialId: 'NEXUS-PY-INT-001' },
    { skillId: 'sk_api_design', level: 'intermediate', score: 60, evidenceCount: 4, verifiedAt: new Date('2024-03-25'), issuedBy: 'NEXUS Assessment Engine', credentialId: 'NEXUS-API-INT-001' },
  ],
  badges: BADGES,
  summary: 'Experienced frontend engineer with expert-level JavaScript and React skills, actively transitioning to ML Engineering with growing Python and data science capabilities.',
  shareUrl: 'https://nexus.ai/passport/akshat-sharma-2024',
};

// ─── Initial AI Messages ──────────────────────────────────────────────────────
export const INITIAL_AI_MESSAGES: AIMessage[] = [
  {
    id: 'msg_welcome',
    role: 'assistant',
    content: `Hi Akshat! I'm your NEXUS AI Tutor. I have full context of your learning profile and current path.

You're 28% through your ML Engineer transition, with a 23-day streak — solid momentum. Right now your most impactful next move is **closing the Pandas gap** (currently Novice → need Intermediate), since it's blocking the EDA Project which is on your critical path to ML Fundamentals.

What would you like to explore today?`,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    skillRefs: ['sk_pandas'],
  },
];

// ─── Learning Behavior ────────────────────────────────────────────────────────
// Akshat's observed behavioral metrics, derived from session history.
// These values influence recommendation scoring:
//   practicePreference (0.75) → project/interactive resources ranked higher
//   challengeTolerance (0.55) → moderate stretch, not pure comfort zone
//   consistency (0.82) → reliable daily practice → streak-based interventions less urgent
//   exploration (0.35) → depth-focused → avoid too many breadth distractions
export const LEARNER_BEHAVIOR: LearningBehavior = {
  userId: 'user_akshat_sharma',
  learningVelocity: 1.3,
  practicePreference: 0.75,
  conceptRetention: 0.68,
  consistency: 0.82,
  challengeTolerance: 0.55,
  exploration: 0.35,
  sessionLengthPreference: 'medium',
  peakHours: [19, 20, 21],
  lastUpdated: new Date(Date.now() - 24 * 3600000),
};

// ─── Demo Learner Context ─────────────────────────────────────────────────────
// Assembles all Akshat Sharma seed data into the LearnerContext shape that every
// intelligence service accepts. Pages and services consume this for the demo
// experience; a real multi-learner implementation passes each user's own context.
export const DEMO_LEARNER_CONTEXT: LearnerContext = {
  user: CURRENT_USER,
  profile: LEARNER_PROFILE,
  goal: ACTIVE_GOAL,
  masteries: SKILL_MASTERIES,
  progress: USER_PROGRESS,
  behavior: LEARNER_BEHAVIOR,
};
