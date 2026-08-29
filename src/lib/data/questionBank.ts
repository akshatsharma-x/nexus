import type { AssessmentQuestion } from '../types';

export const QUESTION_BANK: Record<string, AssessmentQuestion[]> = {
  asmnt_python_basics: [
    {
      id: 'q_py_1',
      type: 'multiple_choice',
      skillId: 'sk_python',
      difficulty: 2,
      text: 'Which of the following creates an immutable sequence in Python?',
      options: ['list()', 'dict()', 'tuple()', 'set()'],
      correctAnswer: 'tuple()',
      explanation:
        'Tuples are immutable — their contents cannot be changed after creation. Lists, dicts, and sets are all mutable.',
    },
    {
      id: 'q_py_2',
      type: 'multiple_choice',
      skillId: 'sk_python',
      difficulty: 2,
      text: 'What does [x**2 for x in range(4)] evaluate to?',
      options: ['[1, 4, 9, 16]', '[0, 1, 4, 9]', '[0, 2, 4, 6]', '[1, 2, 3, 4]'],
      correctAnswer: '[0, 1, 4, 9]',
      explanation: 'range(4) produces 0, 1, 2, 3. Squaring each: 0², 1², 2², 3² = 0, 1, 4, 9.',
    },
    {
      id: 'q_py_3',
      type: 'multiple_choice',
      skillId: 'sk_python',
      difficulty: 2,
      text: 'Which keyword turns a Python function into a generator?',
      options: ['return', 'async', 'yield', 'lambda'],
      correctAnswer: 'yield',
      explanation:
        'The yield keyword makes a function a generator, allowing it to produce values lazily on each call to next().',
    },
    {
      id: 'q_py_4',
      type: 'multiple_choice',
      skillId: 'sk_python',
      difficulty: 2,
      text: 'What does *args capture in a Python function definition?',
      options: [
        'Keyword arguments as a dict',
        'Positional arguments as a tuple',
        'All required arguments',
        'Default argument values',
      ],
      correctAnswer: 'Positional arguments as a tuple',
      explanation:
        '*args collects extra positional arguments into a tuple. **kwargs collects extra keyword arguments into a dict.',
    },
    {
      id: 'q_py_5',
      type: 'multiple_choice',
      skillId: 'sk_python',
      difficulty: 2,
      text: "What is the result of 'hello'[1:4]?",
      options: ["'hel'", "'ell'", "'ello'", "'hell'"],
      correctAnswer: "'ell'",
      explanation:
        "Slicing [start:stop] is exclusive of stop. Indices 1, 2, 3 give 'e', 'l', 'l' → 'ell'.",
    },
  ],

  asmnt_linear_algebra: [
    {
      id: 'q_la_1',
      type: 'multiple_choice',
      skillId: 'sk_linear_algebra',
      difficulty: 3,
      text: 'The dot product of vectors [1, 0] and [0, 1] equals:',
      options: ['1', '0', '-1', '√2'],
      correctAnswer: '0',
      explanation:
        'Dot product = (1×0) + (0×1) = 0. These are orthogonal unit basis vectors — they are perpendicular.',
    },
    {
      id: 'q_la_2',
      type: 'multiple_choice',
      skillId: 'sk_linear_algebra',
      difficulty: 3,
      text: 'Matrix A is 3×4 and matrix B is 4×2. What is the shape of the product AB?',
      options: ['4×4', '3×2', '2×3', 'Undefined — incompatible dimensions'],
      correctAnswer: '3×2',
      explanation:
        'For AB, the inner dimensions must match (4=4 ✓). The result takes the outer dimensions: 3×2.',
    },
    {
      id: 'q_la_3',
      type: 'multiple_choice',
      skillId: 'sk_linear_algebra',
      difficulty: 3,
      text: 'An eigenvector v of matrix A satisfies which equation?',
      options: ['Av = 0', 'Av = λv', 'A + v = λ', 'v · A = v'],
      correctAnswer: 'Av = λv',
      explanation:
        'By definition, an eigenvector v and eigenvalue λ satisfy Av = λv: applying A only scales v by λ.',
    },
    {
      id: 'q_la_4',
      type: 'multiple_choice',
      skillId: 'sk_linear_algebra',
      difficulty: 3,
      text: 'A matrix composed entirely of zero entries has rank:',
      options: ['Equal to its number of columns', '1', '0', 'Equal to its number of rows'],
      correctAnswer: '0',
      explanation:
        'Rank = number of linearly independent rows (or columns). The zero matrix has none, so rank = 0.',
    },
    {
      id: 'q_la_5',
      type: 'multiple_choice',
      skillId: 'sk_linear_algebra',
      difficulty: 3,
      text: 'Two non-zero vectors are orthogonal when their dot product equals:',
      options: ['1', 'The product of their magnitudes', 'Undefined', '0'],
      correctAnswer: '0',
      explanation:
        'Orthogonality means perpendicular. Dot product = |A||B|cos(90°) = 0.',
    },
  ],

  asmnt_stats: [
    {
      id: 'q_st_1',
      type: 'multiple_choice',
      skillId: 'sk_statistics',
      difficulty: 3,
      text: 'In a right-skewed distribution, which measure of central tendency is typically the largest?',
      options: ['Mode', 'Median', 'Mean', 'Standard deviation'],
      correctAnswer: 'Mean',
      explanation:
        'Right skew pulls the tail toward larger values. The mean is sensitive to these outliers, moving it above the median and mode.',
    },
    {
      id: 'q_st_2',
      type: 'multiple_choice',
      skillId: 'sk_statistics',
      difficulty: 3,
      text: 'A p-value of 0.03 indicates:',
      options: [
        'There is a 3% chance the null hypothesis is true',
        'Results at least as extreme would occur 3% of the time if the null hypothesis were true',
        'The effect size is 0.03',
        'The test has 97% accuracy',
      ],
      correctAnswer:
        'Results at least as extreme would occur 3% of the time if the null hypothesis were true',
      explanation:
        'The p-value is the probability of obtaining results at least as extreme as observed, assuming the null hypothesis is true. It is not the probability that H₀ is true.',
    },
    {
      id: 'q_st_3',
      type: 'multiple_choice',
      skillId: 'sk_statistics',
      difficulty: 3,
      text: 'If events A and B are statistically independent, P(A and B) equals:',
      options: ['P(A) + P(B)', 'P(A) × P(B)', 'P(A) − P(B)', 'P(A|B)'],
      correctAnswer: 'P(A) × P(B)',
      explanation:
        'Independence means P(A and B) = P(A) × P(B). For dependent events you must use P(A) × P(B|A).',
    },
    {
      id: 'q_st_4',
      type: 'multiple_choice',
      skillId: 'sk_statistics',
      difficulty: 3,
      text: 'Standard deviation is defined as:',
      options: [
        'The square of the variance',
        'The average distance from the mean',
        'The square root of the variance',
        'Half the range of the data',
      ],
      correctAnswer: 'The square root of the variance',
      explanation:
        'Variance = average squared deviation from the mean. Standard deviation = √(variance), returning the units to the original scale.',
    },
    {
      id: 'q_st_5',
      type: 'multiple_choice',
      skillId: 'sk_statistics',
      difficulty: 3,
      text: "Bayes' theorem computes P(A|B) using:",
      options: [
        'P(A) and P(B) only',
        'P(B|A), P(A), and P(B)',
        'P(A and B) only',
        'P(not A) and P(not B)',
      ],
      correctAnswer: 'P(B|A), P(A), and P(B)',
      explanation:
        "Bayes' theorem: P(A|B) = P(B|A) × P(A) / P(B). It requires the likelihood P(B|A), the prior P(A), and the evidence P(B).",
    },
  ],

  asmnt_ml_concepts: [
    {
      id: 'q_ml_1',
      type: 'multiple_choice',
      skillId: 'sk_ml_fundamentals',
      difficulty: 3,
      text: 'A model achieves 99% training accuracy but only 60% test accuracy. This is most likely:',
      options: [
        'Underfitting',
        'Well-regularized',
        'Overfitting',
        'A labeling error in the test set',
      ],
      correctAnswer: 'Overfitting',
      explanation:
        'The large gap between training and test performance is the hallmark of overfitting: the model memorized training data rather than learning general patterns.',
    },
    {
      id: 'q_ml_2',
      type: 'multiple_choice',
      skillId: 'sk_ml_fundamentals',
      difficulty: 3,
      text: 'The bias-variance tradeoff states that:',
      options: [
        'High-bias models always have high variance',
        'Reducing model bias typically increases variance, and vice versa',
        'Variance can never be reduced below the level of bias',
        'Regularization always increases both bias and variance',
      ],
      correctAnswer: 'Reducing model bias typically increases variance, and vice versa',
      explanation:
        'Simpler models have high bias but low variance (underfit). More complex models reduce bias but increase variance. The goal is balancing both.',
    },
    {
      id: 'q_ml_3',
      type: 'multiple_choice',
      skillId: 'sk_ml_fundamentals',
      difficulty: 3,
      text: 'Which technique estimates model generalization by training and evaluating on multiple data subsets?',
      options: ['Feature scaling', 'Batch normalization', 'L2 regularization', 'Cross-validation'],
      correctAnswer: 'Cross-validation',
      explanation:
        'Cross-validation (e.g. k-fold) partitions data into training and validation sets multiple times, producing a robust generalization estimate.',
    },
    {
      id: 'q_ml_4',
      type: 'multiple_choice',
      skillId: 'sk_ml_fundamentals',
      difficulty: 3,
      text: 'In binary classification, "precision" measures:',
      options: [
        'The fraction of actual positives correctly predicted',
        'The fraction of predicted positives that are truly positive',
        'Overall accuracy across both classes',
        '1 minus the false positive rate',
      ],
      correctAnswer: 'The fraction of predicted positives that are truly positive',
      explanation:
        'Precision = TP / (TP + FP). It answers: of everything I labeled positive, how many actually were? Recall answers the complementary question.',
    },
    {
      id: 'q_ml_5',
      type: 'multiple_choice',
      skillId: 'sk_ml_fundamentals',
      difficulty: 3,
      text: 'L2 regularization (Ridge) adds a penalty to the loss function proportional to:',
      options: [
        'The number of model parameters',
        'The sum of the absolute values of the weights',
        'The sum of the squared weights',
        'The learning rate',
      ],
      correctAnswer: 'The sum of the squared weights',
      explanation:
        'L2 adds λ × Σwᵢ² to the loss. This shrinks weights toward zero but rarely forces exact zeros (that is L1 / Lasso).',
    },
  ],

  asmnt_pandas_project: [
    {
      id: 'q_pd_1',
      type: 'multiple_choice',
      skillId: 'sk_pandas',
      difficulty: 2,
      text: "What does df.groupby('city').agg('mean') return?",
      options: [
        'The mean of the entire DataFrame',
        'A new DataFrame with one row per city showing column means',
        'A list of unique city names',
        'Only the numeric columns of the original DataFrame',
      ],
      correctAnswer: 'A new DataFrame with one row per city showing column means',
      explanation:
        "groupby splits data by the key; agg('mean') computes the mean for each numeric column within each group.",
    },
    {
      id: 'q_pd_2',
      type: 'multiple_choice',
      skillId: 'sk_pandas',
      difficulty: 2,
      text: 'Which Pandas method replaces NaN values with a specified value?',
      options: [
        'df.dropna(value)',
        'df.fillna(value)',
        'df.replace(np.nan, value)',
        'df.impute(value)',
      ],
      correctAnswer: 'df.fillna(value)',
      explanation:
        'df.fillna(value) fills all NaN entries with the given value. df.dropna() removes rows/columns containing NaN instead.',
    },
    {
      id: 'q_pd_3',
      type: 'multiple_choice',
      skillId: 'sk_data_analysis',
      difficulty: 2,
      text: "pd.merge(df1, df2, on='id', how='left') returns:",
      options: [
        "Only rows where 'id' exists in both DataFrames",
        "All rows from df1, with matching rows from df2 (NaN where no match exists)",
        'All rows from both DataFrames',
        'Only rows from df2 that match a row in df1',
      ],
      correctAnswer: "All rows from df1, with matching rows from df2 (NaN where no match exists)",
      explanation:
        "A left join preserves every row from the left DataFrame. Unmatched rows from df2 produce NaN for df2 columns.",
    },
    {
      id: 'q_pd_4',
      type: 'multiple_choice',
      skillId: 'sk_data_analysis',
      difficulty: 2,
      text: 'In exploratory data analysis, which chart best reveals the relationship between two continuous variables?',
      options: ['Bar chart', 'Scatter plot', 'Pie chart', 'Histogram'],
      correctAnswer: 'Scatter plot',
      explanation:
        'Scatter plots show the joint distribution of two continuous variables, revealing correlations, clusters, and outliers at a glance.',
    },
    {
      id: 'q_pd_5',
      type: 'multiple_choice',
      skillId: 'sk_pandas',
      difficulty: 2,
      text: 'df.iloc[2] returns:',
      options: [
        'The row whose index label is 2',
        'The third row by integer position',
        'The third column',
        'The cell at row 2, column 2',
      ],
      correctAnswer: 'The third row by integer position',
      explanation:
        'iloc uses 0-based integer position. iloc[2] is the element at position 2 — the third item. Use .loc for label-based access.',
    },
  ],
};
