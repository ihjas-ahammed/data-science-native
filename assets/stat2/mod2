# Continuous Random Variables and Their Probability Distributions
## Continuous Random Variables
Random variables which can assume infinite number of values from an interval of the form [a,b], e.g.: Height, Temperature, Weight etc.

## Probability Density Function
$p(x \leq X \leq x+dx) = f(x) dx$ is the PDF for a continuous random variable $x$

It satisfies:

1. $f(x) \geq 0$ for all $x$
2. $$\int_{-\infty}^{\infty} f(x) dx = 1$$

### Result 1
$$p(a \leq x \leq b) = p(a \leq x < b) = p(a < x < b) = \int_{a}^{b} f(x) dx$$


### Result 2

$$p(x = a) = 0$$

## Distribution Function

$$F_x(x) = p(X \leq x) = \int_{-\infty}^{x} f(t) dt$$


## Moments of Continuous Probability Distribution

 ### Arithmetic Mean

$$E(x) = \int_{-\infty}^{\infty} xf(x)dx$$

### Median

$$\int_{-\infty}^{M} f(x)dx = \frac{1}{2} = \int_{M}^{\infty} f(x)dx$$

$M$ is determined by solving the equation $f'(x) = 0$ and verifying whether $f''(x) < 0$ at mode

### r<sup>th</sup> Central Moment

$$\mu_r = \int_{-\infty}^{\infty} (x-E(x))^r f(x)dx$$

### Variance as 2<sup>nd</sup> Central Moment
$$\mu_2 = \int_{-\infty}^{\infty} (x-E(x))^2 f(x)dx$$
    
### Quartiles
$$\int_{-\infty}^{Q_1} f(x) dx = \frac{1}{4}$$
$$\int_{-\infty}^{Q_3} f(x) dx = \frac{3}{4}$$

## Rectangular Distributions
$$\ f(x) = \begin{cases} \frac{1}{b-a} & a\leq x \leq b \\ 0 & otherwise\end{cases}$$
 Here a and b are parameters
### Mean
$$ E(x) = \int_{-\infty}^{\infty} xf(x) dx = \frac{a+b} 2$$
### Variance
$$ V(x) =\mu_2 = \int_{-\infty}^{\infty} (x-E(x))^2f(x) dx = \frac{(a-b)^2} 2 $$    
    
* One must try to prove all of these!

## Exponential Distribution
$$\ f(x) = \theta e^{-\theta x}$$
Here $\theta$ is a parameter 
### Mean
$$ E(x) = \int_{-\infty}^{\infty} xf(x) dx = \frac{1} \theta$$
### Variance
$$ V(x) =\mu_2 = \int_{-\infty}^{\infty} (x-E(x))^2f(x) dx = \frac{1} {{\theta}^2} $$

## Normal Distribution

A random variable $X$ is defined to be normally distributed if its probability density function is given by

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

where the parameters are $-\infty < \mu < \infty$ and $\sigma > 0$.

When $X$ follows a normal distribution, we write $X \sim N(\mu, \sigma^2)$.

### Moments

#### Mean

$$E(x) = \int_{-\infty}^{\infty} x f(x) dx$$

$$= \int_{-\infty}^{\infty} (x-\mu+\mu) f(x) dx$$

$$= \int_{-\infty}^{\infty} (x-\mu) f(x) dx + \int_{-\infty}^{\infty} \mu f(x) dx$$

$$= \int_{-\infty}^{\infty} (x-\mu) \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}} dx + \mu \int_{-\infty}^{\infty} f(x) dx$$

Let $z = \frac{x-\mu}{\sigma}$, then $x-\mu = \sigma z$ and $dx = \sigma dz$.

$$= \int_{-\infty}^{\infty} \sigma z \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{z^2}{2}} \sigma dz + \mu \cdot 1$$

$$= \frac{\sigma}{\sqrt{2\pi}} \int_{-\infty}^{\infty} z e^{-\frac{z^2}{2}} dz + \mu$$

$$= 0 + \mu$$

$$= \mu$$

#### Variance

$$V(x) = E[(x - E(x))^2]$$

$$= E[(x - \mu)^2]$$

$$= \int_{-\infty}^{\infty} (x - \mu)^2 f(x) dx$$

$$= \int_{-\infty}^{\infty} (x - \mu)^2 \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}} dx$$

Put $\frac{x-\mu}{\sigma} = z$, then $(x-\mu) = \sigma z$ and $dx = \sigma dz$.

When $x = -\infty$, $z = -\infty$.
When $x = \infty$, $z = \infty$.

$$= \int_{-\infty}^{\infty} (\sigma z)^2 \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{z^2}{2}} \sigma dz$$

$$= \frac{\sigma^2}{\sqrt{2\pi}} \int_{-\infty}^{\infty} z^2 e^{-\frac{z^2}{2}} dz$$

$$= \frac{2\sigma^2}{\sqrt{2\pi}} \int_{0}^{\infty} z^2 e^{-\frac{z^2}{2}} dz$$

Put $\frac{z^2}{2} = u$, then $z^2 = 2u$ and $2z dz = 2 du$, so $dz = \frac{du}{z} = \frac{du}{\sqrt{2u}}$.

When $z = 0$, $u = 0$.
When $z = \infty$, $u = \infty$.

$$= \frac{2\sigma^2}{\sqrt{2\pi}} \int_{0}^{\infty} 2u e^{-u} \frac{du}{\sqrt{2u}}$$

$$= \frac{2\sigma^2}{\sqrt{\pi}} \int_{0}^{\infty} \sqrt{u} e^{-u} du$$

$$= \frac{2\sigma^2}{\sqrt{\pi}} \int_{0}^{\infty} u^{\frac{1}{2}} e^{-u} du$$

$$= \frac{2\sigma^2}{\sqrt{\pi}} \Gamma(\frac{3}{2})$$

$$= \frac{2\sigma^2}{\sqrt{\pi}} \cdot \frac{1}{2} \Gamma(\frac{1}{2})$$

$$= \frac{\sigma^2}{\sqrt{\pi}} \cdot \sqrt{\pi}$$

$$= \sigma^2$$


### Moment Generating Function:

$$
M_X(t) = E(e^{tX})
$$
$$= \int_{-\infty}^{\infty} e^{tx} f(x) \, dx$$


For a normal distribution:

$$
= \int_{-\infty}^{\infty} e^{tx} \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}} \, dx
$$

Using substitution:

$$
x - \mu = z\sigma, \quad dx = \sigma dz
$$

$$
= \frac{1}{\sigma \sqrt{2\pi}} \int_{-\infty}^{\infty} e^{t(\mu+z\sigma)} e^{-z^2/2} \sigma dz
$$

$$
= \frac{e^{t\mu}}{\sqrt{2\pi}} \int_{-\infty}^{\infty} e^{t\sigma z - z^2/2} \, dz
$$

$$
= \frac{e^{\mu t}}{\sqrt{2\pi}} \int_{-\infty}^{\infty} e^{-\frac{1}{2} (z^2 - 2t\sigma z + t^2\sigma^2) + \frac{1}{2}t^2\sigma^2} \, dz
$$

$$
= \frac{e^{\mu t + \frac{1}{2} t^2 \sigma^2}}{\sqrt{2\pi}} \int_{-\infty}^{\infty} e^{-\frac{1}{2} (z - t\sigma)^2} \, dz
$$

Using the substitution:

$$
z - t\sigma = u, \quad dz = du
$$

$$
= \frac{e^{\mu t + \frac{1}{2} t^2 \sigma^2}}{\sqrt{2\pi}} \int_{0}^{\infty} e^{-\frac{u^2}{2}} \, du
$$

Rewriting:

$$
= \frac{e^{\mu t + \frac{1}{2} t^2 \sigma^2}}{\sqrt{2\pi}} \times 2 \int_{0}^{\infty} e^{-u^2/2} \, du
$$

Using substitution:

$$
u^2 = 2v \quad \Rightarrow \quad 2udu = dv, \quad du = \frac{dv}{2u}
$$

$$
= \frac{e^{\mu t + \frac{1}{2} t^2 \sigma^2}}{\sqrt{2\pi}} \times 2 \int_{0}^{\infty} v^{-1/2} e^{-v} \, dv
$$

Using the Gamma function property:

$$
\int_{0}^{\infty} e^{-x} x^{p-1} \, dx = \Gamma(p)
$$

For $ p = \frac{1}{2} $:

$$
\Gamma(1/2) = \sqrt{\pi}
$$

$$
= \frac{e^{\mu t + \frac{1}{2} t^2 \sigma^2}}{\sqrt{\pi}} \times \sqrt{\pi}
$$

$$
= e^{\mu t + \frac{1}{2} t^2 \sigma^2}
$$

### Properties of Normal Distribution

To find diagrams of the normal distribution curve, search for:
**"Normal distribution curve graph"** or **"Bell curve diagram"** on Google Images.

### Properties of the Normal Curve

The following are some of the properties of the normal curve:

1. The normal curve is symmetrical about the ordinate at $x = \mu$.

2. The mean, median, and mode are identical.

3. The normal curve $f(x)$ has a maximum at $x = \mu$, and the maximum value of the ordinate is:
   $$
   \frac{1}{\sigma \sqrt{2\pi}}
   $$

4. The normal curve extends from $-\infty$ to $+\infty$.

5. All odd-order central moments vanish:
   $$
   M_{2r+1} = 0, \quad r = 0,1,2,\dots
   $$

6. The even-order central moments are given by:
   $$
   M_{2r} = 1 \cdot 3 \cdot 5 \dots (2r - 1) \sigma^{2r}
   $$

7. For a normal distribution:
   $$
   \beta_1 = 0 \quad \text{and} \quad \beta_2 = 3
   $$

8. The points of inflection of the curve are at $x = \mu \pm \sigma$.
### Odd-Order Moments About Mean

The odd-order moments about the mean are given by:

$$
M_{2r+1} = \int_{-\infty}^{\infty} (x - \mu)^{2r+1} \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}} dx
$$

Substituting $z = \frac{x - \mu}{\sigma}$, we get:

$$
M_{2r+1} = \frac{\sigma^{2r+1}}{\sqrt{2\pi}} \int_{-\infty}^{\infty} z^{2r+1} e^{-z^2/2} dz
$$

Since the integral of an odd function over a symmetric interval is zero:

$$
M_{2r+1} = 0, \quad r = 0,1,2,\dots
$$

---

### Even-Order Central Moment

The even-order central moment is given by:

$$
M_{2r} = \int_{-\infty}^{\infty} (x - \mu)^{2r} f(x) dx
$$

Substituting $z = \frac{x - \mu}{\sigma}$:

$$
M_{2r} = \frac{\sigma^{2r}}{\sqrt{2\pi}} \int_{-\infty}^{\infty} z^{2r} e^{-z^2/2} dz
$$

Using the transformation $z^2 = u$ and $dz = \frac{du}{2\sqrt{u}}$, we get:

$$
M_{2r} = \frac{2\sigma^{2r}}{\sqrt{2\pi}} \int_{0}^{\infty} u^r e^{-u/2} \frac{du}{\sqrt{2u}}
$$

Applying the Gamma function properties, this simplifies to:

$$
M_{2r} = 1 \cdot 3 \cdot 5 \dots (2r - 1) \sigma^{2r}
$$
Using the Gamma function:

$$
M_{2r} = \frac{2^r \sigma^{2r}}{\sqrt{\pi}} \int_0^\infty u^{r - \frac{1}{2}} e^{-u} du
$$

Since:

$$
\int_0^\infty u^{r - \frac{1}{2}} e^{-u} du = \Gamma(r + \frac{1}{2})
$$

We get:

$$
M_{2r} = \frac{2^r \sigma^{2r}}{\sqrt{\pi}} \Gamma(r + \frac{1}{2})
$$

Using the property:

$$
\Gamma(r + \frac{1}{2}) = (r - \frac{1}{2})(r - \frac{3}{2}) \dots \frac{1}{2} \Gamma(\frac{1}{2})
$$

And knowing:

$$
\Gamma(\frac{1}{2}) = \sqrt{\pi}
$$

We simplify:

$$
M_{2r} = \frac{2^r \sigma^{2r}}{\sqrt{\pi}} \cdot \sqrt{\pi} \cdot (r - \frac{1}{2})(r - \frac{3}{2}) \dots \frac{1}{2}
$$

Rewriting:

$$
M_{2r} = \sigma^{2r} (2r - 1)(2r - 3) \dots 3 \cdot 1
$$

Thus:

$$
M_{2r} = 1 \cdot 3 \cdot 5 \dots (2r - 3)(2r - 1) \sigma^{2r}
$$

---

### Additive Property of Normal Distributions

1. If 

$$
X_1 \sim N(\mu_1, \sigma_1^2) \quad \text{and} \quad X_2 \sim N(\mu_2, \sigma_2^2)
$$

and if $X_1$ and $X_2$ are independent, then:

$$
X_1 + X_2 \sim N(\mu_1 + \mu_2, \sigma_1^2 + \sigma_2^2)
$$

#### Proof:

Since:

$$
X_1 \sim N(\mu_1, \sigma_1^2)
$$

Its moment generating function (MGF) is:

$$
M_{X_1}(t) = e^{\mu_1 t + \frac{1}{2} t^2 \sigma_1^2}
$$

Similarl

### Sum of Independent Normal Variables

#### Theorem 2:
If $ X_i $, where $ i = 1, 2, \dots, n $, are $ n $ independent normal variables with mean $ \mu_i $ and standard deviation $ \sigma_i $, then the variable:

$$
Y = \sum_{i=1}^{n} X_i
$$

is also normally distributed with mean:

$$
\sum_{i=1}^{n} \mu_i
$$

and variance:

$$
\sum_{i=1}^{n} \sigma_i^2
$$

### Proof:

Given:

$$
X_i \sim N(\mu_i, \sigma_i^2), \quad i = 1, 2, \dots, n
$$

The moment generating function (MGF) of $ Y $ is:

$$
M_Y(t) = M_{\sum X_i}(t) = \prod_{i=1}^{n} M_{X_i}(t)
$$

Since the MGF of a normal variable $ X_i $ is:

$$
M_{X_i}(t) = e^{\mu_i t + \frac{1}{2} t^2 \sigma_i^2}
$$

We get:

$$
M_Y(t) = \prod_{i=1}^{n} e^{\mu_i t + \frac{1}{2} t^2 \sigma_i^2}
$$

$$
= e^{\sum_{i=1}^{n} (\mu_i t + \frac{1}{2} t^2 \sigma_i^2)}
$$

$$
= e^{\sum_{i=1}^{n} \mu_i t + \frac{1}{2} t^2 \sum_{i=1}^{n} \sigma_i^2}
$$

This is the MGF of a normal variable with mean $ \sum_{i=1}^{n} \mu_i $ and variance $ \sum_{i=1}^{n} \sigma_i^2 $, proving that:

$$
Y = \sum_{i=1}^{n} X_i \sim N\left( \sum_{i=1}^{n} \mu_i, \sum_{i=1}^{n} \sigma_i^2 \right)
$$

---

### Linear Combination of Independent Normal Variables

### Theorem 3:
If $ X_i $, where $ i = 1, 2, \dots, n $, are $ n $ independent normal variables with mean $ \mu_i $ and standard deviation $ \sigma_i $, then the variable:

$$
Y = \sum_{i=1}^{n} a_i X_i
$$

(where $ a_i $ are constants) is also normally distributed with mean:

$$
\sum_{i=1}^{n} a_i \mu_i
$$

and variance:

$$
\sum_{i=1}^{n} a_i^2 \sigma_i^2
$$

#### Proof:

Given:

$$
X_i \sim N(\mu_i, \sigma_i^2), \quad i = 1, 2, \dots, n
$$

The moment generating function (MGF) of $ X_i $ is:

$$
M_{X_i}(t) = e^{\mu_i t + \frac{1}{2} t^2 \sigma_i^2}
$$

For the linear combination:

$$
Y = \sum_{i=1}^{n} a_i X_i
$$

the MGF is:

$$
M_Y(t) = M_{\sum a_i X_i}(t) = \prod_{i=1}^{n} M_{X_i}(a_i t)
$$

Substituting the MGF:

$$
M_Y(t) = \prod_{i=1}^{n} e^{\mu_i (a_i t) + \frac{1}{2} (a_i t)^2 \sigma_i^2}
$$

$$
= e^{\sum (a_i \mu_i t) + \frac{1}{2} \sum (a_i^2 t^2 \sigma_i^2)}
$$

$$
= e^{(\sum a_i \mu_i) t + \frac{1}{2} t^2 (\sum a_i^2 \sigma_i^2)}
$$

The right-hand side is the MGF of a normal variable with mean:

$$
\sum_{i=1}^{n} a_i \mu_i
$$

and variance:

$$
\sum_{i=1}^{n} a_i^2 \sigma_i^2
$$

Thus:

$$
Y = \sum_{i=1}^{n} a_i X_i \sim N\left( \sum_{i=1}^{n} a_i \mu_i, \sum_{i=1}^{n} a_i^2 \sigma_i^2 \right)
$$

---

## Standard Normal Distribution

For a normally distributed variable:

$$
X \sim N(\mu, \sigma^2)
$$

its probability density function (PDF) is:

$$
f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{(x - \mu)^2}{2\sigma^2}}, \quad -\infty < x < \infty
$$

### Standardization:

Define:

$$
Z = \frac{X - \mu}{\sigma}
$$

By changing the variable, the PDF of $ Z $ is given by:

$$
f(z) = f(x) \left| \frac{dx}{dz} \right|
$$

Since:

$$
\frac{dx}{dz} = \sigma
$$

we get:

$$
f(z) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{(x - \mu)^2}{2\sigma^2}} \cdot \sigma
$$

$$
= \frac{1}{\sqrt{2\pi}} e^{-\frac{z^2}{2}}, \quad -\infty < z < \infty
$$

which is the standard normal distribution.

## Standard Normal Distribution

### Definition

A random variable (rv) is said to be a **standard normal variable** if its probability density function (PDF) is given by:

$$
f(z) = \frac{1}{\sqrt{2\pi}} e^{-z^2/2}, \quad -\infty < z < \infty
$$

The corresponding probability distribution is called the **standard normal distribution**.

- **Mean**: $ E(Z) = 0 $
- **Variance**: $ \text{Var}(Z) = 1 $

We write:

$$
Z \sim N(0,1)
$$

---

## Area Under the Normal Probability Curve

In a normal distribution, to find the probability of the variable lying between two values, say $ a $ and $ b $, we first change these values in terms of the **standard normal variable** by using the substitution:

$$
Z = \frac{X - \mu}{\sigma}
$$

### Standard Normal Table

The table for the area under the **standard normal curve** gives the probability of the variable lying between 0 and any positive value of $ Z $. 
