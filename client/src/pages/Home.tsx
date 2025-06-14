import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CodeBlock from "@/components/CodeBlock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  ChartLine, 
  Shield, 
  Share2, 
  Container, 
  TestTube, 
  Rocket,
  Github,
  Star
} from "lucide-react";
import { codeExamples } from "@/lib/codeExamples";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: Github },
    { id: "splunk", label: "Splunk SIEM", icon: ChartLine },
    { id: "crowdstrike", label: "CrowdStrike EDR", icon: Shield },
    { id: "misp", label: "Microsoft MISP", icon: Share2 },
    { id: "docker", label: "Container Setup", icon: Container },
    { id: "tests", label: "Testing", icon: TestTube },
  ];

  const filteredSections = sections.filter(section => {
    if (!searchQuery) return true;
    const sectionCode = codeExamples[section.id];
    if (!sectionCode) return false;
    return JSON.stringify(sectionCode).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Sidebar 
            sections={sections}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />
          
          <main className="lg:col-span-3 space-y-12">
            {/* Overview Section */}
            <section id="overview" className="scroll-mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">MCP Security Integration Servers</h2>
                  <p className="text-gray-600 mb-6">
                    Comprehensive MCP (Model Context Protocol) server implementations for major security platforms 
                    including Splunk SIEM, CrowdStrike EDR, and Microsoft MISP.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <ChartLine className="text-orange-500 mr-2 h-5 w-5" />
                          <h3 className="font-semibold">Splunk SIEM</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Security Information and Event Management integration with comprehensive search and analytics capabilities.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <Shield className="text-red-500 mr-2 h-5 w-5" />
                          <h3 className="font-semibold">CrowdStrike EDR</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Endpoint Detection and Response platform integration for threat hunting and incident response.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <Share2 className="text-blue-500 mr-2 h-5 w-5" />
                          <h3 className="font-semibold">Microsoft MISP</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Malware Information Sharing Platform integration for threat intelligence sharing.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Splunk SIEM Section */}
            <section id="splunk" className="scroll-mt-6">
              <Card>
                <div className="bg-muted px-6 py-4 border-b">
                  <h2 className="text-xl font-bold flex items-center">
                    <ChartLine className="text-orange-500 mr-3 h-6 w-6" />
                    Splunk SIEM MCP Server
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Server Implementation</h3>
                    <CodeBlock
                      code={codeExamples.splunk.server}
                      language="python"
                      title="splunk_mcp_server.py"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Configuration Example</h3>
                    <CodeBlock
                      code={codeExamples.splunk.config}
                      language="yaml"
                      title="splunk-config.yaml"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* CrowdStrike EDR Section */}
            <section id="crowdstrike" className="scroll-mt-6">
              <Card>
                <div className="bg-muted px-6 py-4 border-b">
                  <h2 className="text-xl font-bold flex items-center">
                    <Shield className="text-red-500 mr-3 h-6 w-6" />
                    CrowdStrike EDR MCP Server
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Server Implementation</h3>
                    <CodeBlock
                      code={codeExamples.crowdstrike.server}
                      language="python"
                      title="crowdstrike_mcp_server.py"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Microsoft MISP Section */}
            <section id="misp" className="scroll-mt-6">
              <Card>
                <div className="bg-muted px-6 py-4 border-b">
                  <h2 className="text-xl font-bold flex items-center">
                    <Share2 className="text-blue-500 mr-3 h-6 w-6" />
                    Microsoft MISP MCP Server
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Server Implementation</h3>
                    <CodeBlock
                      code={codeExamples.misp.server}
                      language="python"
                      title="misp_mcp_server.py"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Container Configuration Section */}
            <section id="docker" className="scroll-mt-6">
              <Card>
                <div className="bg-muted px-6 py-4 border-b">
                  <h2 className="text-xl font-bold flex items-center">
                    <Container className="text-blue-600 mr-3 h-6 w-6" />
                    Container Configuration
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Container Compose</h3>
                    <CodeBlock
                      code={codeExamples.docker.compose}
                      language="yaml"
                      title="docker-compose.yml"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Dockerfile Template</h3>
                    <CodeBlock
                      code={codeExamples.docker.dockerfile}
                      language="dockerfile"
                      title="Dockerfile"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Testing Section */}
            <section id="tests" className="scroll-mt-6">
              <Card>
                <div className="bg-muted px-6 py-4 border-b">
                  <h2 className="text-xl font-bold flex items-center">
                    <TestTube className="text-green-500 mr-3 h-6 w-6" />
                    Unit Tests
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Test Suite Example</h3>
                    <CodeBlock
                      code={codeExamples.tests.suite}
                      language="python"
                      title="test_mcp_servers.py"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Requirements.txt</h3>
                    <CodeBlock
                      code={codeExamples.tests.requirements}
                      language="text"
                      title="requirements.txt"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Quick Start Section */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Rocket className="text-blue-600 mr-2 h-5 w-5" />
                  Quick Start
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Clone the repository and set up environment variables</li>
                  <li>Install dependencies: <Badge variant="secondary" className="mx-1">pip install -r requirements.txt</Badge></li>
                  <li>Configure your security platform credentials</li>
                  <li>Run tests: <Badge variant="secondary" className="mx-1">pytest tests/</Badge></li>
                  <li>Start servers: <Badge variant="secondary" className="mx-1">docker-compose up -d</Badge></li>
                </ol>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
