import React from 'react';

export const ProductHuntEmbed = () => {
    return (
        <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900">We’re on Product Hunt 🚀</h2>
                    <p className="text-slate-600">Support the launch and share feedback.</p>
                </div>

                <div className="w-full flex justify-center">
                    {/* Embed Container */}
                    <div
                        className="overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                        dangerouslySetInnerHTML={{
                            __html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, sans-serif; border: 1px solid rgb(224, 224, 224); border-radius: 12px; padding: 20px; max-width: 500px; background: rgb(255, 255, 255); box-shadow: rgba(0, 0, 0, 0.05) 0px 2px 8px;"><div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;"><img alt="Qrezo - Smart QR Code Generator SaaS" src="https://ph-files.imgix.net/fc66d685-de5e-4039-814f-3e215d2c5cfb.png?auto=format&amp;fit=crop&amp;w=80&amp;h=80" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; flex-shrink: 0;"><div style="flex: 1 1 0%; min-width: 0px;"><h3 style="margin: 0px; font-size: 18px; font-weight: 600; color: rgb(26, 26, 26); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Qrezo - Smart QR Code Generator SaaS</h3><p style="margin: 4px 0px 0px; font-size: 14px; color: rgb(102, 102, 102); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">Print once. Change links forever.</p></div></div><a href="https://www.producthunt.com/products/qrezo-smart-qr-code-generator-saas?embed=true&amp;utm_source=embed&amp;utm_medium=post_embed" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 12px; padding: 8px 16px; background: rgb(255, 97, 84); color: rgb(255, 255, 255); text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Check it out on Product Hunt →</a></div>
                `}}
                    />
                </div>
            </div>
        </section>
    );
};
