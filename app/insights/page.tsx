"use client"

import { useState } from "react"
import InsightCard from "@/components/InsightCard"
import { useRouter } from "next/navigation"

const MOCK_INSIGHTS = [
  // Win Back
  {
    id: "1",
    type: "win_back",
    title: "Summer Win-back Opportunity",
    description: "45 customers who previously bought summer apparel haven't purchased in 90 days. Their health scores are still high (>75). A targeted discount could re-engage them.",
    segmentData: { rule: "win_back" },
    campaignName: "Summer Win-back Campaign",
    campaignGoal: "Target customers with high health scores above 75 who haven't purchased in the last 90 days",
    channel: "email"
  },
  {
    id: "2",
    type: "win_back",
    title: "Lapsed High-Spenders",
    description: "18 customers who spent over ₹5000 previously have gone silent for 60+ days. Win them back before they forget your brand.",
    segmentData: { rule: "win_back_vip" },
    campaignName: "Lapsed VIP Win-back",
    campaignGoal: "Target customers with high health scores who have not ordered in the last 60 days and previously spent large amounts",
    channel: "whatsapp"
  },
  // Over Messaging
  {
    id: "3",
    type: "over_messaging",
    title: "Over-messaging Risk",
    description: "12 customers in the 'Sneakerheads' segment have been messaged 3+ times this week with zero clicks. Suggest resting this group for 14 days.",
    segmentData: { rule: "rest" },
    campaignName: "Sneakerheads Re-engagement",
    campaignGoal: "Target healthy customers who have not received a message in the last 14 days — allow fatigued users to recover",
    channel: "sms"
  },
  {
    id: "4",
    type: "over_messaging",
    title: "Click Fatigue Detected",
    description: "23 customers have received 5+ messages in the past 10 days but none have clicked. Continued messaging will hurt their health score.",
    segmentData: { rule: "click_fatigue" },
    campaignName: "Low Engagement Recovery",
    campaignGoal: "Target customers with declining health scores who are receiving too many messages and need a cooldown period",
    channel: "email"
  },
  // Cross Sell
  {
    id: "5",
    type: "cross_sell",
    title: "Cross-sell Window",
    description: "28 customers bought a laptop in the last 30 days but no accessories. Perfect timing for a targeted accessories campaign.",
    segmentData: { rule: "cross_sell" },
    campaignName: "Laptop Accessories Cross-sell",
    campaignGoal: "Target recently active healthy customers who made a purchase in the last 30 days and are likely to buy related products",
    channel: "whatsapp"
  },
  {
    id: "6",
    type: "cross_sell",
    title: "Seasonal Upsell Ready",
    description: "35 customers who bought winter clothing last year are entering their repurchase window. Their engagement profile shows high receptivity.",
    segmentData: { rule: "seasonal_upsell" },
    campaignName: "Winter Collection Upsell",
    campaignGoal: "Target customers with good health scores who previously bought seasonal products and are likely to repurchase now",
    channel: "email"
  },
  // Churn Risk
  {
    id: "7",
    type: "churn_risk",
    title: "High Value Churn Risk",
    description: "7 VIP customers (LTV > $1000) have dropped to 'At Risk' health status. Personal outreach recommended before they churn completely.",
    segmentData: { rule: "vip_risk" },
    campaignName: "VIP Churn Prevention",
    campaignGoal: "Target at-risk customers with declining health scores who were previously high-value buyers and need personal re-engagement",
    channel: "whatsapp"
  },
  {
    id: "8",
    type: "churn_risk",
    title: "New Customer Dropout",
    description: "14 customers who signed up in the last 60 days haven't made a second purchase. Early intervention can save them before they churn.",
    segmentData: { rule: "new_churn" },
    campaignName: "New Customer Activation",
    campaignGoal: "Target customers with needs attention health status who recently joined but have not made a repeat purchase",
    channel: "sms"
  }
]

const TAB_CONFIG = [
  { id: "all", label: "All", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { id: "win_back", label: "Win Back", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
  )},
  { id: "cross_sell", label: "Cross Sell", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m8 6 4-4 4 4"/><path d="M12 2v10.3"/><path d="M4.93 10.93 2 22h20l-2.93-11.07"/></svg>
  )},
  { id: "churn_risk", label: "Churn Risk", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
  { id: "over_messaging", label: "Over Messaging", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
  )},
]

export default function InsightsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [insights, setInsights] = useState(MOCK_INSIGHTS)

  const handleDismiss = (id: string) => {
    setInsights(insights.filter(i => i.id !== id))
  }

  const handleLaunch = (id: string) => {
    const insight = insights.find(i => i.id === id)
    if (!insight) {
      router.push("/campaigns/new")
      return
    }
    // Pass insight data as query params to pre-fill the campaign wizard
    const params = new URLSearchParams({
      name: insight.campaignName,
      goal: insight.campaignGoal,
      channel: insight.channel,
    })
    router.push(`/campaigns/new?${params.toString()}`)
  }

  const filteredInsights = activeTab === "all"
    ? insights
    : insights.filter(i => i.type === activeTab)

  const countByType = (type: string) =>
    type === "all" ? insights.length : insights.filter(i => i.type === type).length

  const getTabColor = (type: string, active: boolean) => {
    if (!active) return 'text-slate-500 hover:text-white hover:bg-white/[0.04]';
    switch (type) {
      case 'win_back': return 'bg-emerald-500/20 text-emerald-400';
      case 'cross_sell': return 'bg-purple-500/20 text-purple-400';
      case 'churn_risk': return 'bg-red-500/20 text-red-400';
      case 'over_messaging': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-white/[0.08] text-white';
    }
  };

  const getBadgeColor = (type: string, active: boolean) => {
    if (!active) return 'bg-white/[0.05] text-slate-500 group-hover:text-slate-300';
    switch (type) {
      case 'win_back': return 'bg-emerald-500/30 text-emerald-200';
      case 'cross_sell': return 'bg-purple-500/30 text-purple-200';
      case 'churn_risk': return 'bg-red-500/30 text-red-200';
      case 'over_messaging': return 'bg-orange-500/30 text-orange-200';
      default: return 'bg-white/[0.15] text-white';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="text-slate-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/><path d="M12 16h.01"/>
              </svg>
            </span>
            AI Insights
            <span className="bg-indigo-500/15 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">
              {insights.length} Active
            </span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Proactive opportunities detected from your customer data — click <strong className="text-slate-300">Launch Campaign</strong> to act on any insight instantly.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-4 overflow-x-auto custom-scrollbar">
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${getTabColor(tab.id, active)}`}
            >
              <span className={`opacity-80`}>
                {tab.icon}
              </span>
              {tab.label}
              <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-lg transition-colors duration-200 ${getBadgeColor(tab.id, active)}`}>
                {countByType(tab.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {filteredInsights.length === 0 ? (
        <div className="glass-card-static p-12 text-center flex flex-col items-center justify-center min-h-[300px] animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-1">All clear in this category</h3>
          <p className="text-slate-500 text-sm max-w-sm">No active insights here. Your AI engine monitors data continuously and will surface opportunities as they arise.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              {...insight}
              type={insight.type as any}
              onDismiss={() => handleDismiss(insight.id)}
              onLaunch={() => handleLaunch(insight.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
