function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ALL_LEARNING_TOPICS = [

  // SQL - 12 topics
  { title: "SQL JOINs explained - INNER LEFT RIGHT FULL", summary: "Learn when to use each JOIN type to combine tables correctly.", url: "", source: "SQL", tag: "SQL" },
  { title: "GROUP BY and aggregate functions in SQL", summary: "Use COUNT SUM AVG MIN MAX with GROUP BY to summarize data.", url: "", source: "SQL", tag: "SQL" },
  { title: "WHERE vs HAVING in SQL - most beginners confuse these", summary: "WHERE filters rows before grouping, HAVING filters groups after aggregation.", url: "", source: "SQL", tag: "SQL" },
  { title: "SQL subqueries vs CTEs - when to use each", summary: "CTEs make complex queries readable, subqueries keep logic inline.", url: "", source: "SQL", tag: "SQL" },
  { title: "Window functions - ROW_NUMBER RANK DENSE_RANK explained", summary: "Window functions let you rank and compare rows without collapsing them.", url: "", source: "SQL", tag: "SQL" },
  { title: "SQL indexes - why your queries are slow without them", summary: "Indexes speed up SELECT queries by avoiding full table scans.", url: "", source: "SQL", tag: "SQL" },
  { title: "CASE WHEN in SQL - add logic inside your queries", summary: "CASE WHEN lets you create conditional columns directly in SQL.", url: "", source: "SQL", tag: "SQL" },
  { title: "SQL NULL handling - COALESCE NULLIF IS NULL", summary: "NULLs behave differently in SQL - learn to handle them correctly.", url: "", source: "SQL", tag: "SQL" },
  { title: "Stored procedures vs views in SQL", summary: "Views save queries, stored procedures save logic - know the difference.", url: "", source: "SQL", tag: "SQL" },
  { title: "SQL date functions - DATEPART DATEDIFF DATEADD", summary: "Date functions help analysts filter, group, and calculate time differences.", url: "", source: "SQL", tag: "SQL" },
  { title: "Normalization in SQL - 1NF 2NF 3NF simply explained", summary: "Normalization removes redundancy and keeps your database clean.", url: "", source: "SQL", tag: "SQL" },
  { title: "SQL performance tips - avoid SELECT star and use LIMIT", summary: "Small query habits make a big difference on large production databases.", url: "", source: "SQL", tag: "SQL" },

  // Python - 12 topics
  { title: "Pandas read_csv and basic EDA steps", summary: "Load data and explore shape, dtypes, nulls, and describe() in pandas.", url: "", source: "Python", tag: "Python" },
  { title: "Pandas groupby and aggregation for analysts", summary: "Group rows and compute summary statistics with groupby and agg.", url: "", source: "Python", tag: "Python" },
  { title: "Python list comprehensions for data cleaning", summary: "List comprehensions replace loops for faster cleaner data transformations.", url: "", source: "Python", tag: "Python" },
  { title: "Matplotlib bar and line charts for data analysts", summary: "Visualize trends and comparisons with simple matplotlib charts.", url: "", source: "Python", tag: "Python" },
  { title: "Lambda map and filter functions in Python", summary: "Use functional programming tools to transform and filter data quickly.", url: "", source: "Python", tag: "Python" },
  { title: "Pandas merge vs join - combining dataframes correctly", summary: "Merge works like SQL JOIN - know the difference between left right and inner.", url: "", source: "Python", tag: "Python" },
  { title: "Handling missing values in pandas - fillna dropna", summary: "Missing data decisions affect your analysis - don't just drop everything.", url: "", source: "Python", tag: "Python" },
  { title: "Python f-strings for cleaner data reporting", summary: "F-strings make dynamic string formatting readable and fast.", url: "", source: "Python", tag: "Python" },
  { title: "Seaborn heatmaps for correlation analysis", summary: "Heatmaps reveal which variables are related before you build models.", url: "", source: "Python", tag: "Python" },
  { title: "Python dictionaries for lookup tables in data work", summary: "Dictionaries replace VLOOKUP logic in Python data pipelines.", url: "", source: "Python", tag: "Python" },
  { title: "Pandas pivot_table vs groupby - when to use which", summary: "pivot_table gives you Excel-like summaries directly in Python.", url: "", source: "Python", tag: "Python" },
  { title: "try except in Python - handle errors in data pipelines", summary: "Error handling prevents your entire script from crashing on bad data.", url: "", source: "Python", tag: "Python" },

  // Excel - 12 topics
  { title: "XLOOKUP vs VLOOKUP - why column numbers break reports", summary: "XLOOKUP is more flexible and avoids column-index errors in VLOOKUP.", url: "", source: "Excel", tag: "Excel" },
  { title: "Pivot tables in Excel - summarize data in 3 steps", summary: "Pivot tables group and summarize large datasets without formulas.", url: "", source: "Excel", tag: "Excel" },
  { title: "Excel conditional formatting for dashboards", summary: "Highlight key values automatically using rules and color scales.", url: "", source: "Excel", tag: "Excel" },
  { title: "Power Query to automate messy data imports", summary: "Power Query cleans and transforms data before it hits your sheet.", url: "", source: "Excel", tag: "Excel" },
  { title: "Excel INDEX MATCH - more powerful than VLOOKUP", summary: "INDEX MATCH works left-to-right and handles dynamic column references.", url: "", source: "Excel", tag: "Excel" },
  { title: "Excel named ranges - cleaner formulas for analysts", summary: "Named ranges make formulas readable and reduce reference errors.", url: "", source: "Excel", tag: "Excel" },
  { title: "SUMIFS and COUNTIFS - conditional aggregation in Excel", summary: "SUMIFS and COUNTIFS let you aggregate based on multiple conditions.", url: "", source: "Excel", tag: "Excel" },
  { title: "Excel data validation - prevent wrong entries in reports", summary: "Data validation creates dropdown lists and restricts incorrect inputs.", url: "", source: "Excel", tag: "Excel" },
  { title: "Flash Fill in Excel - automate text formatting instantly", summary: "Flash Fill detects patterns and fills columns without formulas.", url: "", source: "Excel", tag: "Excel" },
  { title: "Excel dynamic arrays - FILTER SORT UNIQUE functions", summary: "Dynamic array functions replaced complex array formulas in modern Excel.", url: "", source: "Excel", tag: "Excel" },
  { title: "Sparklines in Excel - mini charts inside cells", summary: "Sparklines show trends inline without taking up dashboard space.", url: "", source: "Excel", tag: "Excel" },
  { title: "Excel shortcuts every data analyst must know", summary: "Ctrl+Shift+L, Alt+E+S+V, F4 - these shortcuts save hours every week.", url: "", source: "Excel", tag: "Excel" },

  // Power BI - 10 topics
  { title: "Power BI DAX CALCULATE - the most important function", summary: "CALCULATE modifies filter context and is the foundation of DAX.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power BI slicers and cross filtering explained", summary: "Slicers let users filter dashboards interactively by any dimension.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power BI star schema - fact and dimension tables", summary: "A proper star schema makes DAX simpler and reports faster.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "DAX TOTALYTD and time intelligence functions", summary: "Time intelligence functions calculate YTD MTD and rolling totals.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power BI row level security for data access control", summary: "RLS restricts what data each user sees in shared reports.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power BI measures vs calculated columns - key difference", summary: "Measures calculate at query time, columns calculate at refresh time.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power BI bookmarks for storytelling dashboards", summary: "Bookmarks save visual states so reports can tell a guided story.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power Query in Power BI - clean before you model", summary: "Bad data in means bad visuals out - clean in Power Query first.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "Power BI report design - one question per dashboard", summary: "The best dashboards answer one focused business question clearly.", url: "", source: "Power BI", tag: "Power BI" },
  { title: "DAX RANKX - rank products regions or salespeople", summary: "RANKX creates dynamic rankings that update with every filter change.", url: "", source: "Power BI", tag: "Power BI" },

  // Tableau - 10 topics
  { title: "Tableau LOD expressions - fix aggregation level", summary: "LOD expressions control which level of detail a calculation runs at.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau dashboard design - one question one view", summary: "Focus each dashboard on one business question with clean layout.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau filters - context filters vs regular filters", summary: "Context filters run first and affect all other filters on the view.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau calculated fields for custom metrics", summary: "Calculated fields let you create new measures without changing the data.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau table calculations - running total percent of total", summary: "Table calculations compute values relative to other rows in the view.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau sets and groups for custom segmentation", summary: "Sets create dynamic segments, groups create static category buckets.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau parameters - make dashboards interactive", summary: "Parameters let users control thresholds, dates, and metrics dynamically.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau data blending vs joins - when to use each", summary: "Blending combines aggregated data, joins combine row-level data.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau story points for data presentations", summary: "Story points turn dashboards into guided narratives for stakeholders.", url: "", source: "Tableau", tag: "Tableau" },
  { title: "Tableau performance tips - extracts vs live connections", summary: "Extracts are faster for large data, live connections give real-time updates.", url: "", source: "Tableau", tag: "Tableau" },

  // Data Analytics - 12 topics
  { title: "Cohort analysis - track user retention over time", summary: "Cohort analysis groups users by start date to measure retention trends.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "KPI selection - pick metrics that drive decisions", summary: "Good KPIs are actionable, measurable, and tied to business outcomes.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Data cleaning checklist before every analysis", summary: "Check nulls, duplicates, outliers, and data types before any analysis.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Funnel analysis - where users drop off in a process", summary: "Funnel analysis identifies the biggest drop-off point in any user journey.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "A/B testing basics - how to run experiments with data", summary: "A/B tests compare two versions to find which performs better statistically.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "RFM analysis - segment customers by behavior", summary: "RFM scores customers on Recency Frequency and Monetary value.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Pareto analysis - the 80-20 rule for business decisions", summary: "80% of results come from 20% of causes - find which 20% matters.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Data storytelling - how to present insights to non-technical teams", summary: "The best analysts translate numbers into decisions, not just charts.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Outlier detection - when to remove and when to investigate", summary: "Not all outliers are errors - some are the most important data points.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Moving averages - smooth noise in time series data", summary: "Moving averages reveal trends by reducing daily fluctuation noise.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Heatmap analysis - spot patterns across two dimensions", summary: "Heatmaps reveal where activity clusters across time, region, or category.", url: "", source: "Data Analytics", tag: "Data Analytics" },
  { title: "Data analyst portfolio - what projects actually get you hired", summary: "Hiring managers want projects that show business thinking, not just coding.", url: "", source: "Data Analytics", tag: "Data Analytics" },

  // Data Engineering - 10 topics
  { title: "ETL vs ELT - what changed with cloud data warehouses", summary: "ELT loads raw data first and transforms inside the warehouse using SQL.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "DBT models - version controlled SQL transformations", summary: "DBT lets analysts write SQL transformations with testing and versioning.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Data pipeline basics - what every analyst should know", summary: "Pipelines move and transform data from source to destination automatically.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Apache Kafka basics - real time data streaming explained", summary: "Kafka handles high volume event streams for real-time data pipelines.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Data warehouse vs data lake vs data lakehouse", summary: "Each storage type suits different data needs - know when to use which.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Slowly changing dimensions in data warehouses", summary: "SCDs track how dimension data changes over time in analytical systems.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Data quality checks every pipeline needs", summary: "Null checks, row count checks, and schema validation catch bad data early.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Partitioning in BigQuery and Snowflake - reduce query costs", summary: "Partitioned tables scan less data and cost less on cloud warehouses.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Airflow basics - schedule and monitor data pipelines", summary: "Airflow DAGs define task dependencies and run pipelines on a schedule.", url: "", source: "Data Engineering", tag: "Data Engineering" },
  { title: "Star schema vs snowflake schema - analytical modeling", summary: "Star schema is simpler and faster for most BI tools and queries.", url: "", source: "Data Engineering", tag: "Data Engineering" },

  // Data Science - 10 topics
  { title: "Train test split and overfitting explained simply", summary: "Split data to check if your model generalizes or just memorizes.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Feature importance - which variables drive your model", summary: "Feature importance scores show which inputs matter most to predictions.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Linear regression explained for beginners", summary: "Linear regression finds the best line through data to predict outcomes.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Confusion matrix - accuracy is not enough", summary: "Precision recall and F1 score tell you more than accuracy alone.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Decision trees explained - how machines learn rules", summary: "Decision trees split data by the most informative feature at each step.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Cross validation - more reliable than a single train test split", summary: "K-fold cross validation gives a more stable estimate of model performance.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Clustering with K-means - group data without labels", summary: "K-means partitions data into K groups based on feature similarity.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Standardization vs normalization - when to scale features", summary: "Scale features before distance-based models like KNN and SVM.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Random forest vs single decision tree - why ensemble wins", summary: "Random forests average many trees to reduce variance and improve accuracy.", url: "", source: "Data Science", tag: "Data Science" },
  { title: "Bias variance tradeoff - the core problem in ML", summary: "High bias underfits, high variance overfits - balance is the goal.", url: "", source: "Data Science", tag: "Data Science" },

];

export async function fetchTrends({ excludedTitles = [], count = 10 } = {}) {
  const excluded = new Set(excludedTitles.map(t => t.toLowerCase()));
  const available = ALL_LEARNING_TOPICS.filter(t => !excluded.has(t.title.toLowerCase()));
  return fisherYatesShuffle(available).slice(0, count);
}
