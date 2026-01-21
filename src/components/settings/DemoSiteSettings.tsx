import { useState, useEffect } from "react";
import { Globe, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoMode } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";

const SESSION_KEY = "demo_session_site_settings";

interface DemoSiteSettingsData {
  site_name: string;
  site_author: string;
  site_description: string;
  contact_email: string;
  footer_text: string;
  twitter_handle: string;
  instagram_url: string;
  facebook_url: string;
  discord_url: string;
}

const DEFAULT_SETTINGS: DemoSiteSettingsData = {
  site_name: "My Game Library",
  site_author: "Demo User",
  site_description: "Browse and discover our collection of board games...",
  contact_email: "demo@example.com",
  footer_text: "© 2024 Demo Organization. All rights reserved.",
  twitter_handle: "@GameLibrary",
  instagram_url: "",
  facebook_url: "",
  discord_url: "",
};

export function DemoSiteSettings() {
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [settings, setSettings] = useState<DemoSiteSettingsData>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load from session storage
  useEffect(() => {
    if (isDemoMode) {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Failed to load demo site settings:", e);
      }
    }
  }, [isDemoMode]);

  const updateSetting = (key: keyof DemoSiteSettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(settings));
      toast({
        title: "Settings saved (Demo)",
        description: "Site settings have been saved to your demo session.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    sessionStorage.removeItem(SESSION_KEY);
    setHasChanges(false);
    toast({
      title: "Settings reset",
      description: "Site settings have been reset to defaults.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Settings
          </CardTitle>
          <CardDescription>
            Manage your site's name, description, and other metadata (demo mode)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => updateSetting("site_name", e.target.value)}
                  placeholder="My Game Library"
                />
                <p className="text-xs text-muted-foreground">
                  The main title of your site
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_author">Site Author</Label>
                <Input
                  id="site_author"
                  value={settings.site_author}
                  onChange={(e) => updateSetting("site_author", e.target.value)}
                  placeholder="Your Name or Organization"
                />
                <p className="text-xs text-muted-foreground">
                  Author/organization name for meta tags
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_description">Site Description</Label>
              <Input
                id="site_description"
                value={settings.site_description}
                onChange={(e) => updateSetting("site_description", e.target.value)}
                placeholder="Browse and discover our collection of board games..."
              />
              <p className="text-xs text-muted-foreground">
                A brief description shown in search results (recommended: under 160 characters)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => updateSetting("contact_email", e.target.value)}
                  placeholder="contact@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Public contact email for inquiries
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Input
                  id="footer_text"
                  value={settings.footer_text}
                  onChange={(e) => updateSetting("footer_text", e.target.value)}
                  placeholder="© 2024 Your Organization. All rights reserved."
                />
                <p className="text-xs text-muted-foreground">
                  Custom text to display in the site footer
                </p>
              </div>
            </div>

            {/* Socials Section */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Socials
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your social media links. These will appear as icons in the site header.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twitter_handle">Twitter/X Handle</Label>
                  <Input
                    id="twitter_handle"
                    value={settings.twitter_handle}
                    onChange={(e) => updateSetting("twitter_handle", e.target.value)}
                    placeholder="@YourHandle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    value={settings.instagram_url}
                    onChange={(e) => updateSetting("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    value={settings.facebook_url}
                    onChange={(e) => updateSetting("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord_url">Discord Invite URL</Label>
                  <Input
                    id="discord_url"
                    value={settings.discord_url}
                    onChange={(e) => updateSetting("discord_url", e.target.value)}
                    placeholder="https://discord.gg/yourserver"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display">About Site Metadata</CardTitle>
          <CardDescription>
            How these settings affect your site
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Note:</strong> In demo mode, these settings are stored in your browser session only.
            In the live version, settings are persisted to the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
