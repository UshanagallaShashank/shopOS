"use client"
// Request Org — end user fills out form to request creating their own org
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Building2, CheckCircle2, Upload, X, FileText, Image as ImageIcon } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PlanType } from "@/lib/types"

export default function RequestOrgPage() {
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [plan, setPlan] = useState<PlanType>("starter")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [businessDocFiles, setBusinessDocFiles] = useState<File[]>([])
  const [description, setDescription] = useState("")
  const [reason, setReason] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")

  // Fetch user's existing requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-org-requests"],
    queryFn: () => api.orgRequests.my(),
  })

  const createRequest = useMutation({
    mutationFn: api.orgRequests.create,
    onSuccess: () => {
      // Reset form
      setOrgName("")
      setOrgSlug("")
      setPlan("starter")
      setLogoFile(null)
      setLogoPreview("")
      setBusinessDocFiles([])
      setDescription("")
      setReason("")
      setAgreedToTerms(false)
      setError("")
    },
    onError: (e: Error) => setError(e.message),
  })

  const pendingRequest = myRequests.find((r) => r.status === "pending")
  const approvedRequest = myRequests.find((r) => r.status === "approved")

  // Handle logo file upload
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file for the logo")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file size must be less than 5MB")
        return
      }
      setLogoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
      setError("")
    }
  }

  // Handle business document files
  function handleBusinessDocsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length + businessDocFiles.length > 5) {
      setError("You can upload a maximum of 5 business documents")
      return
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each document must be less than 10MB")
        return
      }
    }
    setBusinessDocFiles([...businessDocFiles, ...files])
    setError("")
  }

  function removeBusinessDoc(index: number) {
    setBusinessDocFiles(businessDocFiles.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    // For now, we'll convert files to data URLs and store them as strings
    // In production, you'd upload to S3/cloud storage and store URLs
    let logoUrl = ""
    if (logoFile) {
      logoUrl = await fileToDataUrl(logoFile)
    }

    let businessDocsUrls = ""
    if (businessDocFiles.length > 0) {
      const urls = await Promise.all(businessDocFiles.map(f => fileToDataUrl(f)))
      businessDocsUrls = urls.join("|||")
    }

    createRequest.mutate({
      org_name: orgName,
      org_slug: orgSlug,
      plan,
      logo_url: logoUrl || undefined,
      business_docs: businessDocsUrls || undefined,
      description: description || undefined,
      reason: reason || undefined,
    })
  }

  // Helper to convert file to data URL (for demo purposes)
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setOrgName(name)
    setOrgSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Request to Create Your Org</h1>
            <p className="text-muted-foreground text-sm">
              Fill out the form below. A platform admin will review and approve your request.
            </p>
          </div>
        </div>

      {/* Show approved request */}
      {approvedRequest && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <p className="font-medium">Your org "{approvedRequest.org_name}" was approved!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You are now an org_admin. Refresh the page to see your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show pending request */}
      {pendingRequest && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-5">
            <p className="font-medium">Pending Request: {pendingRequest.org_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your request is under review. You'll be notified when it's approved.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Slug</p>
                <p className="font-mono">{pendingRequest.org_slug}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Plan</p>
                <p className="capitalize">{pendingRequest.plan}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request form */}
      {!pendingRequest && !approvedRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Org Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
                
                {/* Org name */}
                <div className="space-y-1.5">
                  <Label htmlFor="orgName">
                    Org Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Meena Boutique"
                    required
                  />
                </div>

                {/* Slug (auto-generated) */}
                <div className="space-y-1.5">
                  <Label htmlFor="orgSlug">
                    Slug <span className="text-destructive">*</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      (your storefront URL: {orgSlug || "your-slug"}.shopOS.in)
                    </span>
                  </Label>
                  <Input
                    id="orgSlug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="meena-boutique"
                    required
                  />
                </div>

                {/* Plan */}
                <div className="space-y-1.5">
                  <Label htmlFor="plan">
                    Plan <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="plan"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as PlanType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="starter">Starter — ₹999/mo</option>
                    <option value="pro">Pro — ₹2,499/mo</option>
                    <option value="enterprise">Enterprise — ₹6,999/mo</option>
                  </select>
                </div>
              </div>

              {/* Branding Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Branding
                </h3>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logoUpload">
                    Logo Image <span className="text-xs text-muted-foreground">(optional, max 5MB)</span>
                  </Label>
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    {logoPreview ? (
                      <div className="relative w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-accent/30 shrink-0">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null)
                            setLogoPreview("")
                          }}
                          className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-accent/30 shrink-0">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Upload button */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="logoUpload"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <label htmlFor="logoUpload">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Upload className="h-3.5 w-3.5 mr-2" />
                            {logoFile ? "Change Logo" : "Upload Logo"}
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG, or SVG. Square images work best.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Documents Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Business Documents
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="businessDocs">
                    Upload Documents{" "}
                    <span className="text-xs text-muted-foreground">
                      (optional, GST certificate, business registration, etc. Max 5 files, 10MB each)
                    </span>
                  </Label>
                  
                  {/* File list */}
                  {businessDocFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {businessDocFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/30"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBusinessDoc(idx)}
                            className="text-destructive hover:text-destructive/80 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {businessDocFiles.length < 5 && (
                    <>
                      <input
                        type="file"
                        id="businessDocs"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleBusinessDocsChange}
                        className="hidden"
                      />
                      <label htmlFor="businessDocs">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Upload className="h-3.5 w-3.5 mr-2" />
                            Add Documents
                          </span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Additional Information
                </h3>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description">Business Description (optional)</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="We sell handcrafted ethnic wear..."
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Why do you want to create this org? (optional)</Label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="I want to bring my boutique online..."
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/30 border border-border">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input accent-primary shrink-0"
                  />
                  <label htmlFor="terms" className="text-sm cursor-pointer">
                    <span className="font-medium">I agree to the terms and conditions</span>
                    <p className="text-muted-foreground mt-1">
                      By submitting this request, I confirm that all information provided is accurate and I agree to
                      ShopOS's Terms of Service and Privacy Policy. I understand that my request will be reviewed by
                      platform administrators.
                    </p>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={createRequest.isPending || !agreedToTerms}
                className="w-full h-11"
              >
                {createRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Previous requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Previous Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Org Name", "Slug", "Plan", "Status", "Submitted"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-accent/50">
                    <td className="px-5 py-3 font-medium">{req.org_name}</td>
                    <td className="px-5 py-3 font-mono text-xs">{req.org_slug}</td>
                    <td className="px-5 py-3 capitalize">{req.plan}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                          req.status === "approved"
                            ? "bg-green-500/10 text-green-400"
                            : req.status === "rejected"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
