"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import CampaignFunnel from "@/components/CampaignFunnel"

export default function CampaignDetailPage() {
  const params = useParams()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/campaigns/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setCampaign(data.campaign || data)
        }
      } catch (err) {
        console.error("Failed to fetch campaign", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()

    // Poll every 5 seconds to catch delayed events like opens and clicks
    const interval = setInterval(fetchCampaign, 5000)

    return () => clearInterval(interval)
  }, [params.id, campaign?.status])

  if (loading && !campaign) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">Loading campaign details...</div>
  }

  if (!campaign) {
    return <div className="p-8 text-center text-rose-400">Campaign not found.</div>
  }

  const stats = {
    sent: campaign.totalSent,
    delivered: campaign.totalDelivered,
    opened: campaign.totalOpened,
    clicked: campaign.totalClicked,
    converted: campaign.totalConverted
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Link href="/campaigns" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
        <span>←</span> Back to Campaigns
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 glass-card p-6 border-l-4 border-l-indigo-500">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              campaign.status === 'running' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
              campaign.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }`}>
              {campaign.status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse mr-1.5"></span>}
              {campaign.status.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 capitalize">
              {campaign.channel}
            </span>
          </div>
          <p className="text-gray-400">Goal: {campaign.goal}</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-1">Sent to Segment</div>
          <div className="text-3xl font-bold text-white">{campaign.totalSent}</div>
        </div>
      </div>

      {campaign.autopsy && (
        <div className="bg-gradient-to-r from-emerald-900/40 to-indigo-900/40 border border-emerald-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h3 className="text-lg font-bold text-emerald-400">AI Campaign Autopsy</h3>
            </div>
            <button 
              onClick={async () => {
                await fetch(`/api/campaigns/${campaign.id}/autopsy`, { method: 'POST' });
              }}
              className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs hover:bg-emerald-500/30 transition-colors"
            >
              Regenerate Analysis
            </button>
          </div>
          <p className="text-emerald-50 text-lg leading-relaxed whitespace-pre-line">
            {campaign.autopsy}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Delivery Funnel</h3>
          {campaign.totalSent > 0 ? (
            <CampaignFunnel stats={stats} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No data to display yet
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Live Feed</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {campaign.communications?.slice(0, 20).map((comm: any) => (
              <div key={comm.id} className="bg-black/20 rounded p-3 text-sm border-l-2 border-white/10 animate-fade-in">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">{comm.customer.name}</span>
                  <span className={`text-xs ${
                    comm.status === 'converted' ? 'text-emerald-400' :
                    comm.status === 'failed' ? 'text-rose-400' :
                    comm.status === 'clicked' ? 'text-indigo-400' :
                    'text-gray-400'
                  }`}>
                    {comm.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(comm.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {(!campaign.communications || campaign.communications.length === 0) && (
              <div className="text-center text-gray-500 mt-10">Waiting for events...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
