import { Link } from "wouter";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogArticles, BlogArticle } from "@/data/blog-articles";
import { Footer } from "@/components/footer";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";
import { motion } from "framer-motion";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function BlogCard({ article, index }: { article: BlogArticle; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/blog/${article.slug}`}>
        <Card className="h-full hover-elevate cursor-pointer group overflow-hidden" data-testid={`card-blog-${article.id}`}>
          <div className="aspect-video overflow-hidden">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {article.category}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>
            </div>
            
            <h2 className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h2>
            
            <p className="text-muted-foreground text-sm line-clamp-3">
              {article.excerpt}
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(article.publishedAt)}
              </div>
              <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Read More <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function FeaturedArticle({ article }: { article: BlogArticle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href={`/blog/${article.slug}`}>
        <Card className="hover-elevate cursor-pointer group overflow-hidden" data-testid="card-featured-blog">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="aspect-video md:aspect-auto overflow-hidden">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <CardContent className="p-8 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="text-xs">Featured</Badge>
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                {article.title}
              </h2>
              
              <p className="text-muted-foreground line-clamp-3">
                {article.excerpt}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {article.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
              </div>
              
              <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all pt-2">
                Read Full Article <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function Blog() {
  const sortedArticles = [...blogArticles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  const featuredArticle = sortedArticles[0];
  const restArticles = sortedArticles.slice(1);
  
  const categories = Array.from(new Set(blogArticles.map(a => a.category)));

  return (
    <>
      <title>Dental Marketing Blog | AI & Lead Generation Tips | {SITE_NAME}</title>
      <meta name="description" content="Expert dental marketing tips, AI strategies, and lead generation guides to help your practice attract more patients and grow revenue." />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6">
            <div className="flex h-16 items-center justify-between">
              <Link href="/">
                <img 
                  src={logoFull} 
                  alt={SITE_NAME}
                  className="h-9 md:h-10 w-auto cursor-pointer object-contain"
                  data-testid="link-logo"
                />
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/#features">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Features
                  </span>
                </Link>
                <Link href="/pricing">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Pricing
                  </span>
                </Link>
                <Link href="/blog">
                  <span className="text-sm text-primary font-medium cursor-pointer">
                    Blog
                  </span>
                </Link>
                <Link href="/demo">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Demo
                  </span>
                </Link>
              </nav>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild data-testid="button-get-started-blog">
                  <Link href="/demo">Book a Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-4">The DentalLeadGenius Blog</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-headline">
                Dental Marketing <span className="text-primary">Insights & Tips</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Expert strategies to attract more patients, automate your practice, and grow your dental business with AI-powered solutions.
              </p>
            </motion.div>
            
            {/* Category Pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-2 mt-8"
            >
              {categories.map((category) => (
                <Badge 
                  key={category} 
                  variant="outline" 
                  className="px-4 py-1.5 text-sm cursor-pointer hover-elevate"
                >
                  {category}
                </Badge>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Article */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <FeaturedArticle article={featuredArticle} />
          </div>
        </section>

        {/* All Articles Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {restArticles.map((article, index) => (
                <BlogCard key={article.id} article={article} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary/5">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Practice?
              </h2>
              <p className="text-muted-foreground mb-8">
                See how AI-powered patient conversion can help you book more appointments, reduce no-shows, and grow your revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild data-testid="button-cta-demo">
                  <Link href="/demo">Book Your Free AI Demo</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
