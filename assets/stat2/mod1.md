#  Discrete  Random  Variables  and  Their  Probability  Distribution

##  Random  Variable  and  Probability  Distribution

A  random  variable  is  a  function  from  a  sample  space  to  a  real  number.

Eg:  For  two  coins  tossed  at  same  time,

S  =  {HH,HT,TH,TT}

Here  let's  define  a  random  variable  ```x```  as  number  of  heads.

<table>
<tr><th></th><th>HH</th><th>HT</th><th>TH</th><th>TT</th></tr>
<tr><th>x</th><td>2</td><td>1</td><td>1</td><td>0</td></tr>
<tr><th>p</th><td>p(x=2)=1/4</td><td>p(x=1)=1/2</td><td>p(x=1)=1/2</td><td>p(x=0)=1/4</td></tr>
</table>

This  table  is  called  probability  distribution  (like  a  frequency  distribution)

E(x)  which  is  expectation  of  x  is  also  mean  of  the  probability  distribution

E(x)=  ∑  x<sub>i</sub>p(x=x<sub>i</sub>)

<hr>


Random  variables  are  also  called  chance  variables  or  stochastic  variables

if  x<sub>1</sub>  and  x<sub>2</sub>  are  random  variables  and  c  is  a  constant.

1.  cx<sub>1</sub>  is  a  random  variable
2.  x<sub>1</sub>  +  x<sub>2</sub>  is  a  random  variable
3.  x<sub>1</sub>  -  x<sub>2</sub>  is  a  random  variable
4.  Max[x<sub>1</sub>,x<sub>2</sub>]  is  a  random  variable
5.  Min[x<sub>1</sub>,x<sub>2</sub>]  is  a  random  variable

###  Probability  Mass  Functions

The  probability  distribution  of  a  discrete  random  variable  is  a  list  of  the  distinct  values  of  x<sub>i</sub>  of  X  with  their  associated  probablities.

f(x<sub>i</sub>)  or  p(X=x<sub>i</sub>)  is  called  probability  mass  function,  provided:

1.  f(x<sub>i</sub>)  >=  0
2.  Σ  f(x<sub>i</sub>)  =  1

*  A  probability  mass  function  can  be  represented  as  a  histogram

###  Distribution  Functions

For  any  random  variable  'X'  the  function  of  the  real  variable  X  defined  as
  F(x)  =  P(X<=x)  is  called  cumulative  probability  distribution  function  or  cumilative  distribution  function

  if  X  is  a  discrete  random  variable  with  probability  mass  function  p(x),  then  the  distribution  function  is  defined  as:

  F(x)  =  p(X<=x)  =  ∑  p(x)

  ###  Properties

  If  F(x)  is  the  distribution  function  of  X:

  1.  It  is  defined  for  all  real  values  of  X
  2.  0  <=  F(x)  <=  1  
  3.  F(-∞)=0  and  F(∞)=1
  4.  a  <  b  =>  F(a)  <  F(b)  =>  F  is  non-decreasing
  5.  The  graph  of  F(x)  is  a  step  function  for  discrete  random  variables


### Mathematical Expectation
* With every distribution of a
random variable we can associate
certain numbers called parameters
of the distribution.

* The distribution function F(X) or
the mass function f(x) complet-
ely characterises the behaviour
of a random variable X.

## Expectation of a Function of a Random Variable

Let g(x) be a function of a discrete random variable X.
The expected value for g(x) is:

E(g(x)) = Σ g(x) P(x)

### Properties of Expectation

 **1. If 'C' is a constant, E(C) = C**

E(C) = Σ C.P(x)
     = C Σ P(x)
     = C x 1
     = C

 **2. Let x be a RV with PDF P(x), and g(x) is a function of X. Then E [ C g(x) ] = C E [g(x)]**

E(C g(x)) = Σ C g(x) P(x)
           = C Σ g(x) P(x)
           = C [ E(g(x)) ]


#### 3. If a and b are constant and x is a RV then,

E [ax+b] = a E(x) + b

E [ax+b] = Σ (ax+b) P(x)

= Σ (ax+b) . P(x)

= Σ ax . P(x) + Σ b P(x)

= a Σ x . P(x) + b Σ P(x)

= a . E(x) + b x 1

= a . E(x) + b

#### 4. Let x be a RV and g(x) and h(x) are functions of x then

E[g(x) + h(x)] = E[g(x)] + E[h(x)]

Proof:

E(g(x) + h(x)) = Σ (g(x) + h(x)) P(x)

= Σ (g(x) P(x) + h(x) P(x))

= Σ g(x) P(x) + Σ h(x) P(x)

= E(g(x)) + E(h(x))

## Moments

### Raw Moments

Let X be a discrete r.v. The r'th raw moment about a value x<sub>0</sub> is defined as,

μ<sub>r</sub>' = E(X - x<sub>0</sub>)<sup>r</sup>, r = 1, 2, 3 - - -

= Σ (x - x<sub>0</sub>)<sup>r</sup> . P(x)

If x<sub>0</sub> = 0, the r'th raw moment about the origin is

μ<sub>r</sub>' = E(X<sup>r</sup>)

= Σ x<sup>r</sup> . P(x)

If r = 1,

μ<sub>1</sub>' = E(X)

μ<sub>1</sub>' = E(X) = Σ x . P(x)

This is the mean of the r.v. X.

### Central Moments

The r'th central moment or the moments about the expected value is defined as μ<sub>r</sub> = E(X - E(X))<sup>r</sup>

If r = 1

μ<sub>1</sub> = E(X - E(X))

= E(X) - E(X) = 0

μ<sub>2</sub> = E(X - E(X))<sup>2</sup>

This is the variance of the r.v of X.

Relation b/w raw moment and central moment:

We can express the r'th central moment in terms of r'th raw moments

μ<sub>r</sub> = μ<sub>r</sub>' - <sup>r</sup>C<sub>1</sub> μ<sub>r-1</sub>' μ<sub>1</sub>' + <sup>r</sup>C<sub>2</sub> μ<sub>r-2</sub>' (μ<sub>1</sub>')<sup>2</sup> + ... + (-1)<sup>r</sup> (μ<sub>1</sub>')<sup>r</sup>

For r = 1

μ<sub>1</sub> = μ<sub>1</sub>' - <sup>1</sup>C<sub>1</sub> μ<sub>0</sub>' μ<sub>1</sub>'

= μ<sub>1</sub>' - 1 x 1 x μ<sub>1</sub>'

= 0

For r = 2

μ<sub>2</sub> = μ<sub>2</sub>' - <sup>2</sup>C<sub>1</sub> μ<sub>1</sub>' μ<sub>1</sub>' + <sup>2</sup>C<sub>2</sub> μ<sub>0</sub>' (μ<sub>1</sub>')<sup>2</sup>

= μ<sub>2</sub>' - 2(μ<sub>1</sub>')<sup>2</sup> + (μ<sub>1</sub>')<sup>2</sup>

= μ<sub>2</sub>' - (μ<sub>1</sub>')<sup>2</sup> → variance.

For r = 3

μ<sub>3</sub> = μ<sub>3</sub>' - <sup>3</sup>C<sub>1</sub> μ<sub>2</sub>' μ<sub>1</sub>' + <sup>3</sup>C<sub>2</sub> μ<sub>1</sub>' (μ<sub>1</sub>')<sup>2</sup> -


μ<sub>3</sub> = μ<sub>3</sub>' - 3C<sub>1</sub> μ<sub>2</sub>' μ<sub>1</sub>' + 3C<sub>2</sub> μ<sub>1</sub>' (μ<sub>1</sub>')<sup>2</sup> - 1 x 1 (μ<sub>1</sub>')<sup>3</sup>

= μ<sub>3</sub>' - 3 μ<sub>2</sub>' μ<sub>1</sub>' + 3 (μ<sub>1</sub>')<sup>3</sup> - (μ<sub>1</sub>')<sup>3</sup>

= μ<sub>3</sub>' - 3 μ<sub>2</sub>' μ<sub>1</sub>' + 2(μ<sub>1</sub>')<sup>3</sup>

## Moment Generating Function (MGF)

The moment generating function of r.v X is defined as

M<sub>X</sub>(t) = E(e<sup>tx</sup>) for -∞ < x < ∞

= Σ e<sup>tx</sup> . P(x)

### Properties

#### 1) If 'c' is a constant

M<sub>cX</sub>(t) = M<sub>X</sub>(ct)

#### 2) If 'a' and 'b' are constant

M<sub>aX+b</sub>(t) = e<sup>bt</sup> M<sub>X</sub>(at)

#### 3) M<sub>X+Y</sub>(t) = M<sub>X</sub>(t) . M<sub>Y</sub>(t)

#### 4) M<sub>X</sub>(t) = 1 at t = 0

#### 5) The MGF uniquely determines the probability distribution if it exists for it.

i.e, corresponding to the given
MGF there is only one probability
distribution

6. μ<sub>r</sub>' = d<sup>r</sup>/dt<sup>r</sup> [M<sub>x</sub>(t)] at t = 0

d/dt M<sub>x</sub>(t)|<sub>t=0</sub> = μ<sub>1</sub>'

d<sup>2</sup>/dt<sup>2</sup> M<sub>x</sub>(t)|<sub>t=0</sub> = μ<sub>2</sub>'

<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #f8fafc;
      color: #1a1a1a;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      margin: 1rem 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #2563eb;
      font-size: 2rem;
      margin-bottom: 1.5rem;
    }
    
    h2 {
      color: #1e40af;
      font-size: 1.5rem;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .formula {
      font-family: 'Computer Modern', serif;
      background: #f1f5f9;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
      overflow-x: auto;
    }
    
    .example {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin: 1rem 0;
    }
    
    .proof {
      border-left: 4px solid #10b981;
      padding-left: 1rem;
      margin: 1rem 0;
    }
    
    .note {
      font-size: 0.9rem;
      color: #4b5563;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Basic Definitions</h2>
    <div class="formula">
      M₂ = M₁' - (M₁)²<br>
      M₂ = E(x - E(x))²<br>
      V(ax) = a²V(x)
    </div>
  </div>

  <div class="card">
    <h2>Properties of Variance</h2>
    <div class="formula">
      1. V(ax²) = E((ax)² - E(ax))²<br>
      2. For random variables x and y:<br>
      V(x + y) = V(x) + V(y) + 2Cov(x,y)<br>
      3. If x and y are independent:<br>
      V(x + y) = V(x) + V(y)
    </div>
  </div>


  <div class="card">
    <h2>Covariance</h2>
    <div class="formula">
      Cov(x,y) = E[(x - E(x))(y - E(y))]<br>
      = E(xy) - E(x)E(y)
    </div>
    <div class="proof">
      <h3>Proof for Independent Variables:</h3>
      If x and y are independent:<br>
      E(xy) = E(x)E(y)<br>
      Therefore:<br>
      Cov(x,y) = E(xy) - E(x)E(y) = 0
    </div>

  </div>

# Binomial Distribution

 A discrete random variable x is defined to have a binomial distribution if the PDF of x is given by:

P(X=x) = <sup>n</sup>C<sub>x</sub> p<sup>x</sup> q<sup>n-x</sup>, x=0,1,2,....n
otherwise = 0,  p+q=1

Here 'n' and 'p' are called parameters of binomial distribution.

→ If a random variable X follows binomial distribution with the parameters 'n' and 'p', we denote,

X ~ B(n, p)
or X ~ B(n, p)

## Mean

E(X) = Σ x P(x)
      <sup>x=0</sup>

= Σ x \* <sup>n</sup>C<sub>x</sub> \* p<sup>x</sup> \* q<sup>n-x</sup>
  <sup>x=0</sup>

= Σ x \* (n! / (x! \* (n-x)!)) \* p<sup>x</sup> \* q<sup>n-x</sup>
  <sup>x=0</sup>

= Σ (n! / ((x-1)! \* (n-x)!)) \* p<sup>x</sup> \* q<sup>n-x</sup>
  <sup>x=0</sup>


= Σ (n! / (x-1)!(n-x)!) p<sup>x</sup> q<sup>n-x</sup>
  <sup>x=1</sup>

= n!/(n-1)! p q<sup>n-1</sup> + n!/(n-2)! p<sup>2</sup> q<sup>n-2</sup> + n!/2!(n-3)! p<sup>3</sup> q<sup>n-3</sup> + ...

= np[q<sup>n-1</sup> + <sup>n-1</sup>C<sub>1</sub> p q<sup>n-2</sup> + <sup>n-1</sup>C<sub>2</sub> p<sup>2</sup> q<sup>n-3</sup> + ... ]

= np[q<sup>n-1</sup> + (n-1)pq<sup>n-2</sup> + (n-1)(n-2)/2 p<sup>2</sup>q<sup>n-3</sup> + ...]

= np[(q+p)<sup>n-1</sup>]
= np

since q+p = 1

**mean = np**

## Variance

V(X) = E(X<sup>2</sup>) - [E(X)]<sup>2</sup>

E(X<sup>2</sup>) = Σ x<sup>2</sup> . p(x)
       <sup>x=0</sup>


= Σ x(x-1) . p(x) + Σ x . p(x)
  <sup>x=0</sup>           <sup>x=0</sup>

= Σ x(x-1) . p(x) + np
  <sup>x=0</sup>

= Σ x(x-1) . p(x) + np
  <sup>x=0</sup>

= Σ x(x-1) . <sup>n</sup>C<sub>x</sub> p<sup>x</sup> q<sup>n-x</sup> + np
  <sup>x=0</sup>

= Σ x(x-1) . (n! / (x!(n-x)!)) p<sup>x</sup> q<sup>n-x</sup> + np
  <sup>x=0</sup>

= Σ (n! / ((x-2)!(n-x)!)) p<sup>x</sup> q<sup>n-x</sup> + np
   <sup>x=0</sup>

= Σ n(n-1) (n-2)! / ((x-2)!(n-x)!) p<sup>x</sup> q<sup>n-x</sup> + np
  <sup>x=2</sup>

= Σ n(n-1) p<sup>2</sup> (n-2)! / ((x-2)!(n-x)!) p<sup>x-2</sup> q<sup>n-x</sup> + np
  <sup>x=2</sup>

= n(n-1)p<sup>2</sup> Σ (n-2)! / ((x-2)!(n-x)!) p<sup>x-2</sup> q<sup>n-x</sup> + np
            <sup>x=2</sup>

= n(n-1)p<sup>2</sup> [q<sup>n-2</sup> + <sup>n-2</sup>C<sub>1</sub> p q<sup>n-3</sup> + <sup>n-2</sup>C<sub>2</sub> p<sup>2</sup> q<sup>n-4</sup> + ...] + np
= n(n-1)p<sup>2</sup> [q+p]<sup>n-2</sup> + np


n!/(n-2)! p<sup>2</sup> q<sup>n-2</sup> + <sup>n</sup>C<sub>1</sub> p q<sup>n-1</sup>

= n(n-1)p<sup>2</sup> q<sup>n-2</sup> + <sup>n</sup>C<sub>1</sub> p q<sup>n-1</sup>
= n(n-1)p<sup>2</sup>q<sup>n-2</sup> + np

= n(n-1)(n-2) p<sup>3</sup> q<sup>n-3</sup> + ... + <sup>n</sup>C<sub>n-1</sub> p q<sup>n-1</sup> + np
  2!

= n(n-1) p<sup>2</sup> [q<sup>n-2</sup> + <sup>n-2</sup>C<sub>1</sub>p q<sup>n-3</sup> + <sup>n-2</sup>C<sub>2</sub> p<sup>2</sup> q<sup>n-4</sup> + ... + <sup>n-2</sup>C<sub>n-2</sub> p<sup>n-2</sup>] + np

= n(n-1)p<sup>2</sup> [q + p]<sup>n-2</sup> + np
= n(n-1)p<sup>2</sup> + np

= n<sup>2</sup>p<sup>2</sup> - np<sup>2</sup> + np


<hr/>

E(x) = np

E(x<sup>2</sup>) = n(n-1)p<sup>2</sup> + np - (np)<sup>2</sup>

V(x) = E(x<sup>2</sup>) - (E(x))<sup>2</sup> = n(n-1)p<sup>2</sup> + np - (np)<sup>2</sup> = np((n-1)p + 1 - np) = np(1-p) = npq

## mgf | Moment Generating Function

Use: 

M<sub>x</sub>(t) = E(e<sup>tx</sup>) = Σ e <sup>tx</sup>p(x)

You get:

M<sub>x</sub>(t) = (q+pe<sup>t</sup>)<sup>n</sup>

## Moments

Moment 1 = np
Moment 2 =  E(x<sup>2</sup>)

# Poisson Distribution

f(x) = e<sup>-λ</sup>λ<sup>x</sup>/x!

x=0,1,2,3...

otherwise, f(x) = 0

Here λ is the parameter of poisson distribution

## Mean and Variance

Use:

E(x) = Σ xp(x)

Also e<sup>λ</sup> = 1 + λ + λ<sup>2</sup>/2! + λ<sup>3</sup>/3! + ...

You'll get:

Mean = λ = Variance

## Mgf

Use:

M<sub>x</sub>(t) = E(e<sup>tx</sup>)

You'll get


M<sub>x</sub>(t) = e<sup>λ(e<sup>t</sup>-1)


