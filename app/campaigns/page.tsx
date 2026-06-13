"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Campaign } from "@prisma/client"
import HealthScoreBadge from "@/components/HealthScoreBadge"
import StatsCard from "@/components/StatsCard"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch("/api/campaigns")
        if (res.ok) {
          const data = await res.json()
          setCampaigns(Array.isArray(data) ? data : data.campaigns || [])
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (!confirm("Are you sure you want to delete this campaign?")) return
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      console.error("Failed to delete campaign", err)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">Manage and track your AI-driven marketing campaigns</p>
        </div>
        <Link 
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-sm font-medium transition-colors duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 h-64 animate-pulse"></div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-6xl mb-4">📣</div>
          <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
          <p className="text-gray-400 mb-6 max-w-md">Create your first AI-driven campaign to start engaging with your customers safely.</p>
          <Link 
            href="/campaigns/new"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/10"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link href={`/campaigns/${campaign.id}`} key={campaign.id} className="block group">
              <div className="glass-card p-6 h-full transition-all duration-300 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{campaign.name}</h3>
                    <p className="text-sm text-gray-400 capitalize flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      {campaign.channel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={campaign.status} />
                    <button 
                      onClick={(e) => handleDelete(e, campaign.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                      title="Delete Campaign"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-6 line-clamp-2 flex-grow">
                  "{campaign.goal}"
                </p>

                <div className="space-y-4 mt-auto">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-gray-400 mb-1">Sent</div>
                      <div className="font-bold text-white">{campaign.totalSent}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-gray-400 mb-1">Delivered</div>
                      <div className="font-bold text-emerald-400">{campaign.totalDelivered}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-gray-400 mb-1">Opened</div>
                      <div className="font-bold text-indigo-400">{campaign.totalOpened}</div>
                    </div>
                  </div>
                  
                  {campaign.status === "running" && (
                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full animate-[pulse-glow_2s_ease-in-out_infinite]"
                        style={{ width: `${Math.max(5, (campaign.totalDelivered / (campaign.totalSent || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Badge({ status }: { status: string }) {
  switch (status) {
    case "draft":
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">Draft</span>
    case "running":
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>Running</span>
    case "completed":
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Completed</span>
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">{status}</span>
  }
}
