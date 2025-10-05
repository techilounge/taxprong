import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SupportForm } from "@/components/support/SupportForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, MessageCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const Support = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-muted-foreground">
            Get help with TaxProNG - browse resources or contact our team
          </p>
        </div>

        {/* Quick Resources */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Book className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Browse articles and guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/knowledge'}>
                View Documentation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Video className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Watch step-by-step guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle>AI Tax Advisor</CardTitle>
              <CardDescription>
                Get instant tax guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/tax-qa'}>
                Ask a Question
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Form */}
        <SupportForm />
      </div>
    </DashboardLayout>
  );
};

export default Support;
