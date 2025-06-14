import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sections: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export default function Sidebar({ sections, activeSection, onSectionClick }: SidebarProps) {
  return (
    <nav className="lg:col-span-1">
      <Card className="sticky top-6">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 text-foreground">Quick Navigation</h3>
          <ul className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <li key={section.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSectionClick(section.id)}
                    className={cn(
                      "w-full justify-start text-sm",
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {section.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </nav>
  );
}
