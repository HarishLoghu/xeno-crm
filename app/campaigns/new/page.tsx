"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function NewCampaignContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form State — pre-filled from insight query params if available
  const [name, setName] = useState(searchParams.get("name") || "")
  const [goal, setGoal] = useState(searchParams.get("goal") || "")
  const [channel, setChannel] = useState(searchParams.get("channel") || "whatsapp")
  
  // AI Generated State
  const [segmentData, setSegmentData] = useState<any>(null)
  const [messageTemplate, setMessageTemplate] = useState("")
  const [subject, setSubject] = useState("")
  const [suppressionData, setSuppressionData] = useState<any>(null)

  const fromInsight = !!(searchParams.get("name") && searchParams.get("goal"))


  const handleSegmentGeneration = async () => {
    if (!goal || !name) return setError("Please fill out name and goal")
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: goal })
      })
      if (!res.ok) throw new Error("Failed to generate segment")
      const data = await res.json()
      setSegmentData(data)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageGeneration = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal, 
          segmentDescription: segmentData?.explanation,
          channel,
          brandName: "Xeno"
        })
      })
      if (!res.ok) throw new Error("Failed to generate message")
      const data = await res.json()
      setMessageTemplate(data.message)
      if (data.subject) setSubject(data.subject)
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuppressionCheck = async () => {
    setLoading(true)
    setError("")
    try {
      // Fetch real customers from the segment
      const params = new URLSearchParams()
      params.set('limit', '500')
      
      // Apply segment filters to get real customers
      const filters = segmentData?.filters?.rules || []
      for (const rule of filters) {
        if (rule.field === 'healthLabel' && rule.operator === 'equals') {
          params.set('healthLabel', rule.value)
        }
        if (rule.field === 'healthScore' && rule.operator === 'gte') {
          params.set('minHealthScore', rule.value)
        }
      }

      const custRes = await fetch(`/api/customers?${params.toString()}`)
      if (!custRes.ok) throw new Error("Failed to fetch customers for suppression check")
      const custData = await custRes.json()
      const customers = (custData.customers || []).slice(0, 200).map((c: any) => ({
        id: c.id,
        name: c.name,
        healthScore: c.healthScore,
        messagesSentLast7Days: c.engagementProfile?.messagesSentLast7Days ?? 0
      }))

      const res = await fetch("/api/ai/suppress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers })
      })
      if (!res.ok) throw new Error("Failed to check suppression")
      const data = await res.json()
      setSuppressionData(data)
      setStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    setLoading(true)
    setError("")
    try {
      // 1. Create campaign
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          goal,
          channel,
          messageTemplate,
          segmentRule: segmentData?.filters || {}
        })
      })
      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to create campaign")
      }
      const data = await createRes.json()
      const campaign = data.campaign || data

      // 2. Trigger send
      const sendRes = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" })
      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to launch campaign")
      }
      
      router.push(`/campaigns/${campaign.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }


  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create AI Campaign</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= i ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-gray-500'
              }`}>
                {i}
              </div>
              {i < 4 && (
                <div className={`w-16 h-1 mx-2 rounded ${step > i ? 'bg-indigo-500' : 'bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-8 min-h-[400px] relative">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {fromInsight && step === 1 && (
          <div className="mb-6 flex items-start gap-3 p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <svg className="text-indigo-400 mt-0.5 flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <p className="text-xs text-indigo-300">
              This campaign has been <strong>pre-filled from your AI Insight</strong>. Review the name and goal below, then click Next to generate your AI segment.
            </p>
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Summer Win-back"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Goal (Plain English)</label>
              <textarea 
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="Find customers who haven't bought in 60 days but have a good health score..."
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Channel</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['whatsapp', 'sms', 'email', 'rcs'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`py-3 rounded-lg border font-medium capitalize transition-all ${
                      channel === c 
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSegmentGeneration}
              disabled={loading}
              className="w-full bg-indigo-600/90 hover:bg-indigo-600 text-white text-sm font-medium py-3 rounded-lg transition-colors duration-150 flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-pulse">Analyzing Audience...</span> : <>Next: AI Segmentation <span>→</span></>}
            </button>
          </div>
        )}

        {/* Step 2: Segment Review */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-4">Target Audience</h2>
            
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-5">
              <h3 className="text-indigo-400 font-medium mb-2">AI Interpretation</h3>
              <p className="text-white text-lg">{segmentData?.explanation}</p>
            </div>

            <div className="bg-black/20 rounded-lg p-6 border border-white/5 text-center">
              <div className="text-4xl font-bold text-white mb-2">{segmentData?.customerCount || "~45"}</div>
              <div className="text-gray-400">Estimated Customers in Segment</div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-lg text-gray-400 hover:text-white transition-colors">
                Back
              </button>
              <button 
                onClick={handleMessageGeneration}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-pulse">Writing Copy...</span> : <>Next: AI Copywriter <span>→</span></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Message Generation */}
        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-4">Message Design</h2>
            
            {channel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Subject Line</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Message Body</label>
              <textarea 
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
                rows={5}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">Use {'{name}'} to insert the customer's name.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg text-gray-400 hover:text-white transition-colors">
                Back
              </button>
              <button 
                onClick={handleSuppressionCheck}
                disabled={loading}
                className="flex-1 bg-indigo-600/90 hover:bg-indigo-600 text-white text-sm font-medium py-3 rounded-lg transition-colors duration-150 flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-pulse">Checking Health Scores...</span> : <>Next: Health Check <span>→</span></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Suppression Check */}
        {step === 4 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <svg className="text-emerald-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Relationship Protection Active</h2>
              <p className="text-emerald-400/90 text-sm max-w-md mx-auto">
                {suppressionData?.explanation || "I'm protecting 2 customers from this send because their health score is too low or they've been messaged too much this week."}
              </p>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-lg p-6 flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-400 mb-1">Total in Segment</div>
                <div className="text-2xl font-bold text-white">{suppressionData?.summary?.total || segmentData?.customerCount || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-red-400 mb-1">Suppressed</div>
                <div className="text-2xl font-bold text-red-500">-{suppressionData?.summary?.suppressed || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-emerald-400 mb-1">Safe to Send</div>
                <div className="text-3xl font-bold text-emerald-400">{suppressionData?.summary?.eligible ?? (segmentData?.customerCount || 0)}</div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={() => setStep(3)} className="px-6 py-3 rounded-lg text-gray-400 hover:text-white transition-colors">
                Back
              </button>
              <button 
                onClick={handleSend}
                disabled={loading || (suppressionData?.summary?.eligible === 0 && segmentData?.customerCount !== 0) || (suppressionData?.summary?.eligible === undefined && segmentData?.customerCount === 0)}
                className="flex-1 bg-indigo-600/90 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-lg transition-colors duration-150 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Launching...</span>
                ) : (
                  <>
                    Launch Campaign 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-pulse text-indigo-400 font-medium">Loading Campaign Wizard...</div>
      </div>
    }>
      <NewCampaignContent />
    </Suspense>
  )
}
