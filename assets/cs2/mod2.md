# Exploratory Data Analysis (EDA)
It is the process of examining data to gain insights and understanding. It can be done either by statistical or graphical methods.

*   **Purpose:**
    *   Summarize main characteristics of datasets.
    *   Identify problems within the data.
    *   Determine data readiness for analysis.
    *   Inform data preparation techniques.
    *   Influence the choice of algorithms for training machine learning (ML) models.
*   **Tools Used in Python:**
    *   pandas
    *   numPy
    *   matplotlib
    *   seaborn
    *   plotly

*   **Objectives:**
    *   Detection of mistakes in the data.
    *   Checking of assumptions about the data.
    *   Preliminary selection of appropriate models.
    *   Determining relationships among explanatory variables.
    *   Assessing the direction and rough size of relationships between explanatory and outcome variables.
*   **Techniques:**
    *   Work by selectively highlighting certain aspects of the data while hiding others to reveal patterns and insights.


## Types of EDA

*   **Two-way Cross-Classification:**
    *   **Graphical vs. Non-graphical:**
        *   **Non-graphical:** Involve calculating summary statistics.
        *   **Graphical:** Summarize data visually using diagrams or pictures.
    *   **Univariate vs. Multivariate (usually Bivariate):**
        *   **Univariate:** Analyze a single variable at a time.
        *   **Multivariate:** Analyze multiple variables simultaneously, often focusing on the relationship between two variables (bivariate).

### Univariate Non-Graphical

*  Understanding the underlying distribution of a **single variable** and making inferences about the population based on a sample. Also includes outlier detection.
*   **Categorical Data:** Analysis centers on the range of values and their frequencies.
*   **Quantitative Data:**
    *   Preliminary assessments of the population distribution are made using the sample data.
    *   Characteristics inferred include:
        *   **Center:** Measures like mean, median, and mode. Mean is most common, but the median is preferred for skewed distributions or when outliers are a concern.
        *   **Spread:** Measures like variance, standard deviation, and interquartile range (IQR). Spread indicates how far data values are likely to be from the center.
        *   **Modality:** Number of peaks in the distribution.
        *   **Shape:** Overall form of the distribution.
        *   **Outliers:** Extreme values that deviate significantly from the rest of the data.
    *   **Skewness:** Measure of asymmetry in the distribution.
    *   **Kurtosis:** Measure of the "peakedness" of the distribution relative to a normal (Gaussian) distribution.

###  Multivariate Non-Graphical Analysis
|Analysing multiple variables without using graphs.

#### Methods:
* **Correlation Matrix**: Shows the relationship strength between multiple variables.
* **Multivariate Regression**: Examines how multiple independent variables affect a dependent variable.
* **Factor Analysis**: Identifies underlying relationships among variables.
* **Principal Component Analysis (PCA)**: Reduces dimensionality while preserving essential information.

### Univariate Graphical Analysis
This involves analyzing a single variable using visual representations to understand its distribution, central tendency, and spread.

#### Key Graphical Techniques:
* **Histogram**: Shows the frequency distribution of a variable.
* **Box Plot**: Displays the median, quartiles, and outliers.

### Multivariate Graphical Analysis
This involves visualizing the relationships between two or more variables using graphs.

## Key Graphical Techniques:

* **Scatter Plot**: Shows the relationship between two numeric variables.
* **Heatmap**: Displays correlations between multiple variables using colors.
* **Bubble Chart**: Similar to a scatter plot but with an added dimension (size of bubbles represents a third variable).

Here's the improved and properly formatted version of your extended EDA notes:  

---

## **Methods of EDA**  

EDA primarily involves:  
1. **Descriptive Statistics** – Numerical summaries of data.  
2. **Data Visualization** – Graphical representations to identify trends and relationships.  

### **Common Visualization Techniques:**  
- **Histograms** – Show data distribution.  
- **Boxplots** – Display quartiles and detect outliers.  
- **Scatter Plots** – Explore relationships between two variables.  
- **Heatmaps** – Represent correlations between variables.  

---

## Descriptive Statistics

Descriptive statistics summarize data using measures of central tendency, dispersion, and shape.  

### Measures of Central Tendency 

These describe the "center" of the data distribution:  

#### Mean (Arithmetic Average):
  $$
  \mu = \frac{1}{N} \sum_{i=1}^{N} x_i
  $$ 

#### Median  
- Middle value when the data is sorted.  
- If **𝑛** is odd:  
  $$
  \text{M} = x_{\frac{n+1}{2}}
$$  
- If **𝑛** is even:  
  $$
  \text{M} = \frac{x_{\frac{n}{2}} + x_{\frac{n}{2}+1}}{2}
  $$  

#### Mode
- Most frequently occurring value in a dataset.  

#### Measures of Dispersion

Dispersion quantifies how spread out the data is.  

#### Range  
$$
\text{Range} = \max(x) - \min(x)
$$  

#### Variance (Spread of Data):  
- **Population Variance (𝜎²):**  
  $$
  \sigma^2 = \frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^2
  $$  
- **Sample Variance (𝑠²):**  
  $$
  s^2 = \frac{1}{n-1} \sum_{i=1}^{n} (x_i - \bar{x})^2
  $$  

#### Standard Deviation (Average Deviation from Mean):
- **Population Standard Deviation (𝜎):**  
$$
  \sigma = \sqrt{\sigma^2}
  $$
- **Sample Standard Deviation (𝑠):**  
  $$
  s = \sqrt{s^2}
  $$  

####Interquartile Range (IQR)
$$
\text{IQR} = Q_3 - Q_1
$$  
- **Q1**: 25th percentile (first quartile).  
- **Q3**: 75th percentile (third quartile).  
- IQR helps detect outliers.  

---

### Skewness and Kurtosis**  

These describe the shape of the data distribution.  

#### Skewness (Measure of Asymmetry)
$$
\text{Skewness} = \frac{1}{n} \sum_{i=1}^{n} \left(\frac{x_i - \bar{x}}{s}\right)^3
$$  
Here ```s``` is Standard devaition
- **Positive Skew** (Right-Skewed): Tail extends to the right.  
- **Negative Skew** (Left-Skewed): Tail extends to the left.  
- **Zero Skew**: Symmetrical distribution.  

#### Kurtosis (Measure of Tailedness)

$$
\text{Kurtosis} = \frac{1}{n} \sum_{i=1}^{n} \left(\frac{x_i - \bar{x}}{s}\right)^4
$$

- **Excess Kurtosis:**  
  $$
  \text{Excess Kurtosis} = \text{Kurtosis} - 3
  $$  
  - **Mesokurtic (≈ 0):** Normal distribution.  
  - **Leptokurtic (> 0):** Heavy tails (more outliers).  
  - **Platykurtic (< 0):** Light tails (fewer outliers).  


## Introduction to python libraries

 <table>
    <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Salary</th>
    </tr>
    <tr>
            <td>Alice</td>
            <td>24</td>
            <td>50,000</td>
    </tr>
    <tr>
            <td>Bob</td>
            <td>27</td>
            <td>60,000</td>
    </tr>
    <tr>
            <td>Charlie</td>
            <td>22</td>
            <td>55,000</td>
    </tr>
    <tr>
            <td>David</td>
            <td>32</td>
            <td>70,000</td>
    </tr>
    <tr>
            <td>Eve</td>
            <td>29</td>
            <td>65,000</td>
    </tr>
</table>

The above data can be represented in python using dictionaries:


```python
data = {
    name: ["Alice","Bob","Charlie","David","Eve"],
    age: [24,27,22,32,29],
    salary: [50000,60000,50000,30000,65000]
}
```

We use python libraries like:

1. Panda
2. MathplotLib
3. Seaborn

To work on the data, first by coverting it into a *data frame* by using panda

```python
import panda as pd
df = pd.DataFrame(data)
```

### Data Frame

It is a 2D data structure in python with rows and columns

#### Features

* Two Dimensional
* Labeled Axes
* Flexible and Powerful

#### Finding Measures using DataFrame

Since dataframe is still the dictionary, you can find the measures like this:

```python
meanAge = df["age"].mean()
medianAge = df["age"].median()
```

Similarly, we have function for mod, variance etc.

### Visualizations

For graphical representation we use ```matplotlib``` and ```seaborn```

* ```matplotlib``` is used to show the screen and set the screen size
* ```seaborn``` is used to plot the type of graph, like histogram or boxplot.

For example, if we already have dataFrame ```df```

```python
# Import matplotlib and seaborn (assuming we already have pandas as pd)

import matplotlib.pyplot as plt
import seaborn as sns

# Create the screen using figure by matplot lib

plt.figure((10)) # specify width and height

# Plot Histogram using seaborn

sns.histplot(data=df,x="age",bins=10) # x as category and bins as interval size

# Add a title and show the plot

plt.title("Histogram of Value2")
plt.show()
```

Similarly you can create box plot using ```sns.boxplot()``` function

<a href="mod2.2.html">Next part (Same module) </a>