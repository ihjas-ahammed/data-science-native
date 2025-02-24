# Data Preprocessing
Handling missing values and noisy data, also removing ```outliers```

* Values that make big deviations in the measures of center are called outliers

After that we integrate (mix) , transform (fix format, units etc.) and reduce data ( getting the specific part needed for analysis ).

The whole process is called data preprocessing.

It is required because data in the real world is incomplete, noicy (with errors and outliers) and inconsistent (with duplicates).

### Advantages
* Improved Quality
* Enhanced Model Performance
* Reduce complexity
* Facilitate or support modle interpretablity: To make it capable of better prediction and easier interpretation of outcomes

## Data Cleaning

Transform raw data into format suitable for analysis.

* Handle missing values
* Correct error
* Remove duplicate
* Type conversion

Each technique is applied based on the nature of data.
It ensures that the data used to analyse is accurate, consistant and reliable.

## Noise Identification

* Visualisations are used to analyse anomlilies in the dataset.
* Z-Score is also useful to find deviation from mean.

```Outlier detection``` can be done by using boxplot

Methods for outlier detection:
* **Statistical Methods**: These include Z-score and Standard Deviation methods. Data points that lie beyond 3 standard deviations from the mean are typically considered outliers. The Z-score measures how many standard deviations away from the mean a data point is.
* **Interquartile Range (IQR) Method**: Using box plots, points that fall below Q1 - 1.5×IQR or above Q3 + 1.5×IQR are considered outliers. This is a robust method as it's not affected by extreme values like the mean-based methods.
* **Isolation Forest**: This algorithm isolates observations by randomly selecting a feature and randomly selecting a split value between the maximum and minimum values of that feature. Outliers are easier to isolate and thus have shorter path lengths.
* **DBSCAN (Density-Based Spatial Clustering of Applications with Noise)**: This clustering algorithm identifies points that are in low-density regions as outliers. It's particularly effective for datasets where outliers are defined by their local density rather than global statistics

## Data Transformation

Transformation refers to the process of fixing formats or units of data during integration.

### Standerdization and Normalization


To convert default units of dimension to a new dimension base within a specific range by considering their mean and standard deviation.

Like days, a weight range from 0 to 120 lbs, and height range 0 to 6 ft completed in between 0 and 1, this process can be termed as scaling.


#### Standard Scaling / Z-Score:

$$ x_i' = \frac{x_i - μ}σ  $$

Where:
- $x_i'$ is the standardized value,
- $x_i$ is the original value,
- $μ$ is the mean,
- $σ$ is the standard deviation.


#### Min-Max Scaling:


$$ x_i' = \frac{x_i -x_{min}}{x_{max} - x_{min}} $$


Where:
- $x_i'$ is the scaled value,
- $x_i$ is the original value,
- $x_{min}$ is the minimum value of the dataset,
- $x_{max}$ is the maximum value of the dataset.

#### Robust Scaling:


 $$ x_i' = \frac{x_i-Q_1}{Q_3-Q_1} $$


Where:


- $x_i'$ is the scaled value,
- $x_i$ is the original value,
- $Q$ for quartiles


#### Normalizer:


$$ x_i' = \frac{x_i}x $$


Where:
- $x_i'$ is the normalized value,
- $x_i$ is the original value,
- $x$ is norm which is square root of sum of squares of all values


## Data Cleaning using python

Correcting typos using .replace:
```python
df['column_name'] = df['column_name'].replace({'mutible': 'immutable', 'erro': 'error'})
```

Deal with missing values (i.e Imputation) using sklearn

```python
from sklearn.impute import SimpleImputer
imputer = SimpleImputer(strategy='mean') #Load a mean imputer
df['column_name'] = imputer.fit_transform(df['column_name']) # Replcaes missing values with mean
```

Remove duplicates:
```python
df = df.drop_duplicates()
```
Remove missing value rows:

```python
df = df.dropna()
```

### Using filna

```python
df['column_name'] =filna(replace_with,inplace=True)
```

eg: Here age is replaced with mean

```python
df['Age'] = filna(df['Age'].mean(),inplace=True)
```

### Removing outliers using z-score


```python
# Import modules
from scipy import stats
import numpy as np
# find z_score with columns needed (Here age only)
z_score =np.abs(stats.z_score(df[['Age']]))

# get cleaned df by limiting z_score by 3 (or any other number)
df_cleaned = df[(z_score < 3).all(axios = 1)]

```