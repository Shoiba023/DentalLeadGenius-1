import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointerClick, 
  Calendar,
  Target,
  Mail,
  MessageSquare,
  MapPin,
  Flame,
  Thermometer,
  Snowflake,
  Eye,
  ArrowRight,
  Trophy
} from "lucide-react";

interface DashboardSummary {
  overview: {
    totalVisitors: number;
    totalDemos: number;
    totalLeads: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
  today: {
    visitors: number;
    demos: number;
    leads: number;
  };
  trends: {
    visitorsChange: number;
    demosChange: number;
    leadsChange: number;
  };
  topVariant: {
    id: string;
    views: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  } | null;
  topCity: {
    city: string;
    country: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  } | null;
  leadScores: {
    hot: number;
    warm: number;
    cold: number;
  };
}

interface VariantStats {
  id: string;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

interface FunnelStats {
  pageViews: number;
  uniqueVisitors: number;
  scrolled50: number;
  scrolled75: number;
  ctaClicks: number;
  demoStarts: number;
  demoCompletes: number;
  leadsCreated: number;
  conversionRates: {
    viewToScroll: number;
    scrollToClick: number;
    clickToDemo: number;
    demoToComplete: number;
    overallConversion: number;
  };
}

interface CityStats {
  city: string;
  country: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

interface MessageStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

interface LeadScoreDistribution {
  hot: number;
  warm: number;
  cold: number;
  total: number;
  averageScore: number;
}

interface CTAStats {
  ctaId: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

interface ScrollDepthStats {
  depth: number;
  count: number;
  percentage: number;
}

const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#8b5cf6",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#6b7280"
};

const VARIANT_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"
];

export default function AnalyticsDashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/analytics/dashboard"]
  });

  const { data: variants, isLoading: variantsLoading } = useQuery<VariantStats[]>({
    queryKey: ["/api/analytics/variants"]
  });

  const { data: funnel, isLoading: funnelLoading } = useQuery<FunnelStats>({
    queryKey: ["/api/analytics/funnel"]
  });

  const { data: cities, isLoading: citiesLoading } = useQuery<CityStats[]>({
    queryKey: ["/api/analytics/cities"]
  });

  const { data: emailStats } = useQuery<MessageStats>({
    queryKey: ["/api/analytics/email"]
  });

  const { data: smsStats } = useQuery<MessageStats>({
    queryKey: ["/api/analytics/sms"]
  });

  const { data: leadScores } = useQuery<LeadScoreDistribution>({
    queryKey: ["/api/analytics/lead-scores"]
  });

  const { data: ctaStats } = useQuery<CTAStats[]>({
    queryKey: ["/api/analytics/cta"]
  });

  const { data: scrollStats } = useQuery<ScrollDepthStats[]>({
    queryKey: ["/api/analytics/scroll-depth"]
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4" />
          {value}%
        </span>
      );
    }
    return <span className="text-sm text-muted-foreground">0%</span>;
  };

  if (dashboardLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const funnelData = funnel ? [
    { name: "Visitors", value: funnel.uniqueVisitors, fill: CHART_COLORS.primary },
    { name: "Scrolled 50%", value: funnel.scrolled50, fill: CHART_COLORS.secondary },
    { name: "CTA Clicks", value: funnel.ctaClicks, fill: CHART_COLORS.accent },
    { name: "Demo Starts", value: funnel.demoStarts, fill: CHART_COLORS.warning },
    { name: "Completed", value: funnel.demoCompletes, fill: CHART_COLORS.danger }
  ] : [];

  const leadScoreData = leadScores ? [
    { name: "Hot", value: leadScores.hot, fill: CHART_COLORS.danger },
    { name: "Warm", value: leadScores.warm, fill: CHART_COLORS.warning },
    { name: "Cold", value: leadScores.cold, fill: CHART_COLORS.primary }
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your conversion performance and growth metrics</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          Real-time
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList data-testid="tabs-analytics">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel" data-testid="tab-funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="ab-testing" data-testid="tab-ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads">Lead Quality</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-total-visitors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.overview.totalVisitors.toLocaleString() || 0}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Today: {dashboard?.today.visitors || 0}</span>
                  <TrendIndicator value={dashboard?.trends.visitorsChange || 0} />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-demo-bookings">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Demo Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.overview.totalDemos || 0}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Today: {dashboard?.today.demos || 0}</span>
                  <TrendIndicator value={dashboard?.trends.demosChange || 0} />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-conversion-rate">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.overview.conversionRate || 0}%</div>
                <Progress value={dashboard?.overview.conversionRate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card data-testid="card-avg-session">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(dashboard?.overview.avgSessionDuration || 0)}
                </div>
                <span className="text-sm text-muted-foreground">Time on site</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performing Variant
                </CardTitle>
                <CardDescription>Current A/B test leader</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.topVariant ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">Variant {dashboard.topVariant.id}</span>
                      <Badge className="bg-green-500">{dashboard.topVariant.conversionRate}% CVR</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{dashboard.topVariant.views}</div>
                        <div className="text-sm text-muted-foreground">Views</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{dashboard.topVariant.clicks}</div>
                        <div className="text-sm text-muted-foreground">Clicks</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{dashboard.topVariant.ctr}%</div>
                        <div className="text-sm text-muted-foreground">CTR</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data yet. Start driving traffic to see results.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Top Performing City
                </CardTitle>
                <CardDescription>Best converting location</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.topCity ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{dashboard.topCity.city}</span>
                      <Badge variant="outline">{dashboard.topCity.country}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{dashboard.topCity.visitors}</div>
                        <div className="text-sm text-muted-foreground">Visitors</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{dashboard.topCity.conversions}</div>
                        <div className="text-sm text-muted-foreground">Conversions</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{dashboard.topCity.conversionRate}%</div>
                        <div className="text-sm text-muted-foreground">CVR</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No city data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Quality Distribution</CardTitle>
              <CardDescription>Current lead scoring breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                    <Flame className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{dashboard?.leadScores.hot || 0}</div>
                    <div className="text-sm text-muted-foreground">Hot Leads</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <Thermometer className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{dashboard?.leadScores.warm || 0}</div>
                    <div className="text-sm text-muted-foreground">Warm Leads</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Snowflake className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{dashboard?.leadScores.cold || 0}</div>
                    <div className="text-sm text-muted-foreground">Cold Leads</div>
                  </div>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadScoreData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                      >
                        {leadScoreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Track visitors through each stage of your funnel</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="space-y-8">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {funnel && Object.entries(funnel.conversionRates).map(([key, value]) => (
                      <div key={key} className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-lg font-semibold">{value}%</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {funnelData.map((stage, index) => (
                      <div key={stage.name} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                          <span className="font-medium">{stage.name}</span>
                          <Badge variant="secondary">{stage.value}</Badge>
                        </div>
                        {index < funnelData.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                A/B Test Leaderboard
              </CardTitle>
              <CardDescription>Hero headline variant performance ranked by conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              {variantsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : variants && variants.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={variants}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="id" tickFormatter={(v) => `Variant ${v}`} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" fill={CHART_COLORS.primary} name="Views" />
                        <Bar dataKey="clicks" fill={CHART_COLORS.secondary} name="Clicks" />
                        <Bar dataKey="conversions" fill={CHART_COLORS.accent} name="Conversions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div 
                        key={variant.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        data-testid={`variant-row-${variant.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <div>
                            <span className="font-semibold">Variant {variant.id}</span>
                            {index === 0 && <Badge className="ml-2 bg-yellow-500">Leader</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{variant.views}</div>
                            <div className="text-muted-foreground">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{variant.clicks}</div>
                            <div className="text-muted-foreground">Clicks</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{variant.ctr}%</div>
                            <div className="text-muted-foreground">CTR</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{variant.conversionRate}%</div>
                            <div className="text-muted-foreground">CVR</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No A/B test data yet. Start driving traffic to see variant performance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scroll Depth Distribution</CardTitle>
                <CardDescription>How far visitors scroll on your landing page</CardDescription>
              </CardHeader>
              <CardContent>
                {scrollStats && scrollStats.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scrollStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="depth" tickFormatter={(v) => `${v}%`} />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke={CHART_COLORS.primary} 
                          fill={CHART_COLORS.primary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No scroll data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5" />
                  CTA Click Performance
                </CardTitle>
                <CardDescription>Which call-to-action buttons get the most clicks</CardDescription>
              </CardHeader>
              <CardContent>
                {ctaStats && ctaStats.length > 0 ? (
                  <div className="space-y-4">
                    {ctaStats.slice(0, 5).map((cta, index) => (
                      <div key={cta.ctaId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{cta.ctaId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">{cta.clicks} clicks</span>
                          <Progress value={(cta.clicks / (ctaStats[0]?.clicks || 1)) * 100} className="w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No CTA click data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                City Performance
              </CardTitle>
              <CardDescription>Top cities by visitor count and conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              {citiesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : cities && cities.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cities.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="visitors" fill={CHART_COLORS.primary} name="Visitors" />
                      <Bar yAxisId="right" dataKey="conversionRate" fill={CHART_COLORS.secondary} name="CVR %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No city data yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Flame className="h-5 w-5" />
                  Hot Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{leadScores?.hot || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">Ready to convert</p>
                <Progress value={100} className="mt-3 bg-red-100" />
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Thermometer className="h-5 w-5" />
                  Warm Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{leadScores?.warm || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">Showing interest</p>
                <Progress value={60} className="mt-3 bg-orange-100" />
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Snowflake className="h-5 w-5" />
                  Cold Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{leadScores?.cold || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">Need nurturing</p>
                <Progress value={30} className="mt-3 bg-blue-100" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Score Distribution</CardTitle>
              <CardDescription>Overall lead quality breakdown with average score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadScoreData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {leadScoreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Scored Leads</div>
                    <div className="text-3xl font-bold">{leadScores?.total || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Lead Score</div>
                    <div className="text-3xl font-bold">{leadScores?.averageScore || 0}/100</div>
                    <Progress value={leadScores?.averageScore || 0} className="mt-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Campaign Performance
                </CardTitle>
                <CardDescription>Email nurture sequence metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {emailStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{emailStats.sent}</div>
                        <div className="text-sm text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{emailStats.opened}</div>
                        <div className="text-sm text-muted-foreground">Opened</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{emailStats.clicked}</div>
                        <div className="text-sm text-muted-foreground">Clicked</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Open Rate</span>
                        <div className="flex items-center gap-2">
                          <Progress value={emailStats.openRate} className="w-32" />
                          <span className="font-semibold">{emailStats.openRate}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Click Rate</span>
                        <div className="flex items-center gap-2">
                          <Progress value={emailStats.clickRate} className="w-32" />
                          <span className="font-semibold">{emailStats.clickRate}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reply Rate</span>
                        <div className="flex items-center gap-2">
                          <Progress value={emailStats.replyRate} className="w-32" />
                          <span className="font-semibold">{emailStats.replyRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No email campaign data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  SMS Campaign Performance
                </CardTitle>
                <CardDescription>SMS follow-up sequence metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {smsStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{smsStats.sent}</div>
                        <div className="text-sm text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{smsStats.delivered}</div>
                        <div className="text-sm text-muted-foreground">Delivered</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{smsStats.replied}</div>
                        <div className="text-sm text-muted-foreground">Replied</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Reply Rate</span>
                        <div className="flex items-center gap-2">
                          <Progress value={smsStats.replyRate} className="w-32" />
                          <span className="font-semibold">{smsStats.replyRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No SMS campaign data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
