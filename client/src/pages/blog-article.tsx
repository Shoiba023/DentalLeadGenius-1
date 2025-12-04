import { useRoute, Link, Redirect } from "wouter";
import { Calendar, Clock, User, ArrowLeft, Share2, Linkedin, Twitter, Facebook, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBlogBySlug, getRelatedArticles, BlogArticle } from "@/data/blog-articles";
import { Footer } from "@/components/footer";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME, SITE_URL } from "@shared/config";
import { motion } from "framer-motion";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function MarkdownContent({ content }: { content: string }) {
  const processContent = (text: string) => {
    const lines = text.trim().split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];
    
    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={elements.length} className={`my-4 pl-6 space-y-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'}`}>
            {currentList.map((item, i) => (
              <li key={i} className="text-foreground/90" dangerouslySetInnerHTML={{ __html: processInline(item) }} />
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };
    
    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={elements.length} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {tableHeaders.map((header, i) => (
                    <th key={i} className="px-4 py-3 text-left font-semibold text-foreground bg-muted/50">
                      {header.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-foreground/90">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        tableHeaders = [];
        inTable = false;
      }
    };
    
    const processInline = (text: string): string => {
      return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline font-medium">$1</a>');
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        flushList();
        const cells = trimmedLine.slice(1, -1).split('|').map(c => c.trim());
        
        if (cells.every(c => /^[-:]+$/.test(c))) {
          continue;
        }
        
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }
      
      if (trimmedLine === '') {
        flushList();
        continue;
      }
      
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold mt-10 mb-4 text-foreground">
            {trimmedLine.slice(3)}
          </h2>
        );
        continue;
      }
      
      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-xl font-semibold mt-8 mb-3 text-foreground">
            {trimmedLine.slice(4)}
          </h3>
        );
        continue;
      }
      
      if (trimmedLine.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={elements.length} className="border-l-4 border-primary pl-4 py-2 my-6 italic text-foreground/80 bg-muted/30 rounded-r">
            <span dangerouslySetInnerHTML={{ __html: processInline(trimmedLine.slice(2)) }} />
          </blockquote>
        );
        continue;
      }
      
      if (trimmedLine.startsWith('- [ ] ') || trimmedLine.startsWith('- [x] ')) {
        flushList();
        const checked = trimmedLine.startsWith('- [x] ');
        const text = trimmedLine.slice(6);
        elements.push(
          <div key={elements.length} className="flex items-center gap-2 my-1">
            <input type="checkbox" checked={checked} readOnly className="h-4 w-4 rounded border-border" />
            <span className="text-foreground/90" dangerouslySetInnerHTML={{ __html: processInline(text) }} />
          </div>
        );
        continue;
      }
      
      if (trimmedLine.match(/^[-*] /)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(trimmedLine.slice(2));
        continue;
      }
      
      if (trimmedLine.match(/^\d+\. /)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(trimmedLine.replace(/^\d+\. /, ''));
        continue;
      }
      
      if (trimmedLine === '---') {
        flushList();
        elements.push(<Separator key={elements.length} className="my-8" />);
        continue;
      }
      
      flushList();
      elements.push(
        <p key={elements.length} className="my-4 text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(trimmedLine) }} />
      );
    }
    
    flushList();
    flushTable();
    
    return elements;
  };
  
  return <div className="prose-content">{processContent(content)}</div>;
}

function RelatedArticleCard({ article }: { article: BlogArticle }) {
  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="h-full hover-elevate cursor-pointer group">
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <Badge variant="secondary" className="text-xs mb-2">{article.category}</Badge>
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readTime}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function BlogArticlePage() {
  const [match, params] = useRoute("/blog/:slug");
  
  if (!match || !params?.slug) {
    return <Redirect to="/blog" />;
  }
  
  const article = getBlogBySlug(params.slug);
  
  if (!article) {
    return <Redirect to="/blog" />;
  }
  
  const relatedArticles = getRelatedArticles(article.slug, 3);
  const shareUrl = `${SITE_URL}/blog/${article.slug}`;

  return (
    <>
      <title>{article.metaTitle}</title>
      <meta name="description" content={article.metaDescription} />
      <meta property="og:title" content={article.metaTitle} />
      <meta property="og:description" content={article.metaDescription} />
      <meta property="og:image" content={article.featuredImage} />
      <meta property="og:url" content={shareUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      
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
                <Button asChild>
                  <Link href="/demo">Book a Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Article Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <Link href="/blog">
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-6">
                  <ArrowLeft className="h-4 w-4" /> Back to Blog
                </span>
              </Link>
              
              <Badge className="mb-4">{article.category}</Badge>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6" data-testid="text-article-title">
                {article.title}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6">
                {article.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
            </motion.div>
          </div>
        </section>

        {/* Featured Image */}
        <div className="container mx-auto px-6 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* Article Content */}
        <article className="py-12 md:py-16">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <MarkdownContent content={article.content} />
              
              {/* Share Section */}
              <Separator className="my-12" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold mb-2">Share this article</p>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      asChild
                      data-testid="button-share-twitter"
                    >
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      asChild
                      data-testid="button-share-linkedin"
                    >
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      asChild
                      data-testid="button-share-facebook"
                    >
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                <Button asChild data-testid="button-book-demo-article">
                  <Link href="/demo">
                    Book Your Free AI Demo <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container mx-auto px-6">
              <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <RelatedArticleCard key={related.id} article={related} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <Card className="max-w-3xl mx-auto bg-primary/5 border-primary/10">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Transform Your Practice?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  See how AI-powered patient conversion can help you book more appointments and grow your revenue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/demo">Book Your Free AI Demo</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
