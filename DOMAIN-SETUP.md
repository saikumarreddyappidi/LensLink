# DNS Configuration Helper for LensLink

## 🌐 **DOMAIN TO PORT CONNECTION GUIDE**

### **What You Need:**
1. **Live Website URL** (from deployment)
2. **Domain Name** (buy from registrar)
3. **DNS Records** (connect domain to site)

---

## **STEP 1: Deploy Your Site (Get Live URL)**

### Option A: Netlify (Easiest - 5 minutes)
1. Go to [netlify.com](https://netlify.com)
2. Drag your project folder to deploy
3. Get URL: `https://amazing-site-12345.netlify.app`

### Option B: Heroku (Most Popular)
```bash
heroku create your-lenslink-site
git push heroku main
# Get URL: https://your-lenslink-site.herokuapp.com
```

### Option C: Vercel (Fastest)
```bash
npm install -g vercel
vercel --prod
# Get URL: https://your-site.vercel.app
```

---

## **STEP 2: Buy Domain Name**

### **Recommended Registrars:**
- **Namecheap** ($10-12/year) - Most popular
- **Google Domains** ($12/year) - Simple
- **Cloudflare** ($8-10/year) - Advanced

### **Domain Examples:**
- `lenslink-photography.com`
- `yourname-photos.com`
- `capture-moments.com`

---

## **STEP 3: Connect Domain to Your Site**

### **For Netlify Deployment:**

#### In Netlify Dashboard:
1. Go to Site Settings → Domain Management
2. Click "Add custom domain"
3. Enter: `yourdomain.com`
4. Netlify will show DNS records like:
```
NETLIFY DNS RECORDS:
A Record: @ → 75.2.60.5
CNAME: www → your-site.netlify.app
```

#### In Your Domain Registrar (Namecheap/GoDaddy):
1. Login to domain control panel
2. Find "DNS Management" or "Advanced DNS"
3. Add these records:

```
Type: A
Host: @
Value: 75.2.60.5
TTL: 30 min

Type: CNAME  
Host: www
Value: your-site.netlify.app
TTL: 30 min
```

### **For Heroku Deployment:**

#### In Heroku Dashboard:
1. App Settings → Domains
2. Add domain: `yourdomain.com`
3. Copy DNS target: `your-app-12345.herokudns.com`

#### In Your Domain Registrar:
```
Type: CNAME
Host: www
Value: your-app-12345.herokudns.com

Type: A
Host: @
Value: 76.76.19.61
```

### **For Vercel Deployment:**

#### In Vercel Dashboard:
1. Project Settings → Domains
2. Add: `yourdomain.com`
3. Copy provided DNS records

#### In Your Domain Registrar:
```
Type: A
Host: @
Value: 76.76.21.21

Type: CNAME
Host: www  
Value: cname.vercel-dns.com
```

---

## **STEP 4: Wait & Test**

### **DNS Propagation Time:**
- **Minimum:** 30 minutes
- **Average:** 2-6 hours  
- **Maximum:** 48 hours

### **Test Your Domain:**
```bash
# Test if domain resolves
nslookup yourdomain.com

# Test website (after propagation)
curl -I https://yourdomain.com
```

### **Online Tools:**
- [whatsmydns.net](https://whatsmydns.net) - Check DNS propagation
- [dnschecker.org](https://dnschecker.org) - Verify DNS records

---

## **STEP 5: Enable HTTPS (SSL)**

### **Automatic SSL (Recommended):**
- **Netlify:** Automatic SSL after domain connects
- **Heroku:** Add SSL certificate in dashboard
- **Vercel:** Automatic SSL enabled

### **Final Result:**
Your photography booking site will be live at:
- ✅ `https://yourdomain.com`
- ✅ `https://www.yourdomain.com`
- ✅ Secure (green lock icon)
- ✅ Professional domain name

---

## **🚨 QUICK ACTION PLAN:**

### **TODAY (5 minutes):**
1. Deploy to Netlify (drag & drop)
2. Get your live URL

### **TOMORROW (15 minutes):**
1. Buy domain from Namecheap
2. Add DNS records from Netlify
3. Wait for propagation

### **DAY 3:**
1. Test your custom domain
2. Share your professional photography site!

**Your LensLink site: `https://yourdomain.com` 🚀📸**
