"use client"
// Org Requests — platform_admin reviews pending org creation requests
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, CheckCircle2, XCircle, ExternalLink, FileText, Image as ImageIcon, Clock, User, X, Download } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { OrgRequest } from "@/lib/types"

// Modal for viewing images/documents
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",", 2)
  const mime = header.match(/:(.*?);/)?.[1] ?? "application/octet-stream"
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function ViewerModal({ url, type, onClose }: { url: string; type: "image" | "document"; onClose: () => void }) {
  const isDataUrl = url.startsWith("data:")
  const isImage = type === "image" || url.startsWith("data:image")

  function handleDownload() {
    const link = document.createElement("a")
    link.href = url
    link.download = isImage ? "logo.png" : "document.pdf"
    link.click()
  }

  function handleOpenInTab() {
    if (isDataUrl) {
      const blob = dataUrlToBlob(url)
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank")
    } else {
      window.open(url, "_blank")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-accent/30">
          <h3 className="font-semibold flex items-center gap-2">
            {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {isImage ? "Logo Preview" : "Document Preview"}
          </h3>
          <div className="flex gap-2">
            {!isImage && (
              <Button size="sm" variant="outline" onClick={handleOpenInTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in tab
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-80px)] bg-accent/10">
          {isImage ? (
            <div className="p-6">
              <img src={url} alt="Preview" className="w-full h-auto rounded-lg border border-border" />
            </div>
          ) : (
            <div className="bg-card p-8">
              <div className="flex flex-col items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="font-medium">Document uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    Open in a new tab for a full-page preview, or download directly.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleOpenInTab} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open in new tab
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrgRequestsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<"pending" | "all">("pending")
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approved" | "rejected"; orgName: string } | null>(null)
  const [viewerModal, setViewerModal] = useState<{ url: string; type: "image" | "document" } | null>(null)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["org-requests", filter],
    queryFn: () => api.orgRequests.list(filter === "pending" ? "pending" : undefined),
  })

  const { data: allRequests = [] } = useQuery({
    queryKey: ["org-requests", "all"],
    queryFn: () => api.orgRequests.list(undefined),
  })

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      api.orgRequests.review(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-requests"] })
      setConfirmAction(null)
    },
  })

  const pending = allRequests.filter((r) => r.status === "pending")
  const approved = allRequests.filter((r) => r.status === "approved")
  const rejected = allRequests.filter((r) => r.status === "rejected")

  function handleConfirm() {
    if (!confirmAction) return
    review.mutate({ id: confirmAction.id, status: confirmAction.action })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-6 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Org Requests</h1>
                <p className="text-muted-foreground">
                  Review and approve requests from users who want to create their own organizations
                </p>
              </div>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
            <Button
              size="sm"
              variant={filter === "pending" ? "default" : "ghost"}
              onClick={() => setFilter("pending")}
              className="relative"
            >
              Pending
              {pending.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-primary-foreground text-primary">
                  {pending.length}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "ghost"}
              onClick={() => setFilter("all")}
            >
              All ({allRequests.length})
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-4xl font-bold text-yellow-500">{pending.length}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Approved</p>
                  <p className="text-4xl font-bold text-green-500">{approved.length}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Rejected</p>
                  <p className="text-4xl font-bold text-red-500">{rejected.length}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {!isLoading && requests.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No requests found</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                {filter === "pending" ? "All caught up! No pending requests." : "No org requests yet."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {requests.map((req: OrgRequest) => (
            <Card key={req.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-accent/50 to-accent/20 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {req.org_name}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          req.status === "approved"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : req.status === "rejected"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono flex items-center gap-1.5">
                      <ExternalLink className="h-3 w-3" />
                      {req.org_slug}.shopOS.in
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        req.plan === "enterprise" ? "bg-purple-500" :
                        req.plan === "pro" ? "bg-blue-500" : "bg-green-500"
                      }`} />
                      <p className="font-semibold capitalize">{req.plan}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested By</p>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {req.user_email || `User ${req.user_id.slice(0, 8)}...`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</p>
                    <p className="text-sm flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(req.created_at).toLocaleDateString("en-IN", { 
                        month: "short", 
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  
                  {req.created_org_id && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created Org</p>
                      <a
                        href={`/orgs/${req.created_org_id}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1.5 font-medium"
                      >
                        View Org <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Description & Reason */}
                {(req.description || req.reason) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    {req.description && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Business Description
                        </p>
                        <div 
                          className="text-sm leading-relaxed bg-accent/30 p-3 rounded-lg cursor-help relative group"
                          title={req.description}
                        >
                          <p className="line-clamp-3">{req.description}</p>
                          {req.description.length > 150 && (
                            <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-full max-w-md p-3 bg-popover border border-border rounded-lg shadow-lg z-10 text-sm">
                              {req.description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {req.reason && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Reason for Request
                        </p>
                        <div 
                          className="text-sm leading-relaxed bg-accent/30 p-3 rounded-lg cursor-help relative group"
                          title={req.reason}
                        >
                          <p className="line-clamp-3">{req.reason}</p>
                          {req.reason.length > 150 && (
                            <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-full max-w-md p-3 bg-popover border border-border rounded-lg shadow-lg z-10 text-sm">
                              {req.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Logo & Documents */}
                {(req.logo_url || req.business_docs) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    {req.logo_url && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Logo
                        </p>
                        {req.logo_url.startsWith("data:image") ? (
                          <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-accent/20">
                            <img
                              src={req.logo_url}
                              alt="Org logo"
                              className="w-20 h-20 rounded-lg border-2 border-border object-cover shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setViewerModal({ url: req.logo_url!, type: "image" })}
                            />
                            <button
                              onClick={() => setViewerModal({ url: req.logo_url!, type: "image" })}
                              className="text-sm text-primary hover:underline flex items-center gap-2 font-medium"
                            >
                              <ImageIcon className="h-4 w-4" />
                              View full size
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <a
                            href={req.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-4 rounded-lg border border-border bg-accent/20 hover:bg-accent/30 transition-colors text-primary font-medium"
                          >
                            <ImageIcon className="h-4 w-4" />
                            View logo
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {req.business_docs && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Business Documents
                        </p>
                        {req.business_docs.includes("|||") ? (
                          <div className="space-y-2">
                            {req.business_docs.split("|||").map((doc, idx) => (
                              <button
                                key={idx}
                                onClick={() => setViewerModal({ url: doc, type: "document" })}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/20 hover:bg-accent/30 transition-colors group"
                              >
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                    Document {idx + 1}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Click to view or download</p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setViewerModal({ url: req.business_docs!, type: "document" })}
                            className="w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-accent/20 hover:bg-accent/30 transition-colors group"
                          >
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-medium group-hover:text-primary transition-colors">
                              View document
                            </span>
                            <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      size="lg"
                      onClick={() => setConfirmAction({ id: req.id, action: "approved", orgName: req.org_name })}
                      disabled={review.isPending}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve & Create Org
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => setConfirmAction({ id: req.id, action: "rejected", orgName: req.org_name })}
                      disabled={review.isPending}
                      className="flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Request
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={confirmAction.action === "approved" ? "Approve Org Request" : "Reject Org Request"}
          description={
            confirmAction.action === "approved"
              ? `Are you sure you want to approve "${confirmAction.orgName}"? This will create the organization and assign the user as org_admin.`
              : `Are you sure you want to reject "${confirmAction.orgName}"? The user will be notified of the rejection.`
          }
          confirmText={confirmAction.action === "approved" ? "Approve" : "Reject"}
          variant={confirmAction.action === "approved" ? "default" : "destructive"}
          loading={review.isPending}
        />
      )}

      {/* Viewer Modal */}
      {viewerModal && (
        <ViewerModal
          url={viewerModal.url}
          type={viewerModal.type}
          onClose={() => setViewerModal(null)}
        />
      )}
    </div>
  )
}
