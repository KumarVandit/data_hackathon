package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

const (
	viewServices = iota
	viewLogs
	viewStats
	viewGraph
	viewConfig
	viewPipeline
	viewDashboard
)

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("62")).
			Padding(1, 2)

	statusStyle = lipgloss.NewStyle().
			Bold(true).
			Padding(0, 1)

	successStyle = statusStyle.Copy().Foreground(lipgloss.Color("42"))
	errorStyle   = statusStyle.Copy().Foreground(lipgloss.Color("196"))
	warningStyle = statusStyle.Copy().Foreground(lipgloss.Color("214"))

	infoStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("240")).
			Padding(0, 1)

	boxStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("62")).
			Padding(1, 2).
			Margin(1, 0)

	tabStyle = lipgloss.NewStyle().
			Padding(0, 2).
			MarginRight(1)

	activeTabStyle = tabStyle.Copy().
			Foreground(lipgloss.Color("62")).
			Bold(true).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("62")).
			BorderTop(false).
			BorderLeft(false).
			BorderRight(false)
)

type model struct {
	currentView    int
	selected       int
	services       []service
	stats          systemStats
	containerStats map[string]containerStat
	lastUpdate     time.Time
	statusMsg      string
	statusType     string
	logs           map[string][]string
	logViewer      string // which service logs are being viewed
	graphStats     graphStats
}

type service struct {
	name        string
	status      string
	port        string
	url         string
	containerID string
	uptime      string
	health      string
}

type systemStats struct {
	cpuPercent  float64
	memPercent  float64
	diskPercent float64
	cpuCount    int
	memTotal    uint64
	memUsed     uint64
	diskTotal   uint64
	diskUsed    uint64
}

type containerStat struct {
	cpuPercent float64
	memPercent float64
	memUsage   string
	status     string
}

type graphStats struct {
	nodeCount  int
	edgeCount  int
	lastUpdate string
}

type tickMsg time.Time
type statusMsg struct {
	message string
	msgType string
}

func initialModel() model {
	return model{
		currentView: viewServices,
		selected:    0,
		services: []service{
			{name: "Ollama", port: "11434", url: "http://localhost:11434"},
			{name: "FalkorDB", port: "6379", url: "http://localhost:3000"},
			{name: "Graphiti MCP", port: "8000", url: "http://localhost:8000"},
			{name: "Atlas Engine", port: "", url: ""},
			{name: "Atlas Dashboard", port: "5173 (UI) / 8001 (API)", url: "http://localhost:5173"},
		},
		stats:          systemStats{},
		containerStats: make(map[string]containerStat),
		lastUpdate:     time.Now(),
		statusMsg:      "Ready",
		statusType:     "success",
		logs:           make(map[string][]string),
		logViewer:      "",
		graphStats:     graphStats{},
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		checkServices(),
		updateStats(),
		updateContainerStats(),
		tick(),
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "tab":
			// Switch views
			m.currentView = (m.currentView + 1) % 7
			m.selected = 0
			return m, nil
		case "shift+tab":
			m.currentView = (m.currentView + 6) % 7
			m.selected = 0
			return m, nil
		case "1":
			m.currentView = viewServices
			m.selected = 0
			return m, checkServices()
		case "2":
			m.currentView = viewLogs
			m.selected = 0
			return m, nil
		case "3":
			m.currentView = viewStats
			return m, tea.Batch(updateStats(), updateContainerStats())
		case "4":
			m.currentView = viewGraph
			return m, updateGraphStats()
		case "5":
			m.currentView = viewConfig
			return m, nil
		case "6":
			m.currentView = viewDashboard
			return m, nil
		case "7":
			m.currentView = viewPipeline
			return m, nil
		case "up", "k":
			if m.selected > 0 {
				m.selected--
			}
		case "down", "j":
			maxSelection := m.getMaxSelection()
			if m.selected < maxSelection {
				m.selected++
			}
		case "enter", " ":
			return m, m.handleAction()
		case "r":
			return m, checkServices()
		case "s":
			return m, tea.Batch(
				startServices(),
				func() tea.Msg { return statusMsg{message: "Starting all core services...", msgType: "info"} },
			)
		case "x":
			return m, stopServices()
		case "b":
			return m, buildServices()
		case "p":
			return m, startProcessing()
		case "d":
			return m, startDashboard()
		case "l":
			if m.currentView == viewServices && m.selected < len(m.services) {
				m.logViewer = m.services[m.selected].name
				m.currentView = viewLogs
				return m, fetchLogs(m.services[m.selected].name)
			}
		case "R":
			if m.currentView == viewServices && m.selected < len(m.services) {
				return m, restartService(m.services[m.selected].name)
			}
		}

	case tickMsg:
		cmds := []tea.Cmd{updateStats(), tick()}
		if m.currentView == viewStats {
			cmds = append(cmds, updateContainerStats())
		}
		if m.currentView == viewLogs && m.logViewer != "" {
			cmds = append(cmds, fetchLogs(m.logViewer))
		}
		return m, tea.Batch(cmds...)

	case statusMsg:
		m.statusMsg = msg.message
		m.statusType = msg.msgType
		return m, nil

	case systemStats:
		m.stats = msg
		m.lastUpdate = time.Now()
		return m, nil

	case map[string]containerStat:
		m.containerStats = msg
		return m, nil

	case []service:
		m.services = msg
		return m, nil

	case logMsg:
		m.logs[msg.service] = msg.lines
		return m, nil

	case graphStats:
		m.graphStats = msg
		return m, nil
	}

	return m, nil
}

func (m model) View() string {
	var s string

	// Title
	s += titleStyle.Render("🌍 Project Atlas: Control Panel") + "\n\n"

	// Tabs
	s += m.renderTabs() + "\n\n"

	// Content based on current view
	switch m.currentView {
	case viewServices:
		s += m.renderServicesView()
	case viewLogs:
		s += m.renderLogsView()
	case viewStats:
		s += m.renderStatsView()
	case viewGraph:
		s += m.renderGraphView()
	case viewConfig:
		s += m.renderConfigView()
	case viewPipeline:
		s += m.renderPipelineView()
	case viewDashboard:
		s += m.renderDashboardView()
	}

	// Status bar
	s += "\n" + m.renderStatusBar()

	return s
}

func (m model) renderTabs() string {
	tabs := []string{"Services (1)", "Logs (2)", "Stats (3)", "Graph (4)", "Config (5)", "Dashboard (6)"}
	var rendered []string
	for i, tab := range tabs {
		if i == m.currentView {
			rendered = append(rendered, activeTabStyle.Render(tab))
		} else {
			rendered = append(rendered, tabStyle.Render(tab))
		}
	}
	return lipgloss.JoinHorizontal(lipgloss.Left, rendered...)
}

func (m model) renderServicesView() string {
	servicesBox := boxStyle.Render(
		"🔧 Service Management\n\n" +
			m.renderServices() +
			"\n" + m.renderHelp("Services"),
	)
	return servicesBox + "\n"
}

func (m model) renderServices() string {
	var s string
	
	// Service dependencies info
	depsInfo := map[string]string{
		"Graphiti MCP": "→ Depends on: FalkorDB, Ollama",
		"Atlas Engine": "→ Depends on: Graphiti MCP, FalkorDB",
		"Atlas Dashboard": "→ Depends on: Graphiti MCP, FalkorDB",
	}
	
	for i, svc := range m.services {
		cursor := " "
		if i == m.selected {
			cursor = "▶"
		}

		statusIcon := "○"
		statusColor := "240"
		if svc.status == "running" {
			statusIcon = "●"
			statusColor = "42"
		} else if svc.status == "stopped" {
			statusIcon = "○"
			statusColor = "196"
		}

		statusRender := lipgloss.NewStyle().Foreground(lipgloss.Color(statusColor)).Render(statusIcon)

		portInfo := svc.port
		if portInfo == "" {
			portInfo = "N/A"
		}

		info := fmt.Sprintf("%s %s %s", statusRender, svc.name, portInfo)
		if svc.uptime != "" {
			info += fmt.Sprintf(" | Uptime: %s", svc.uptime)
		}
		if svc.health != "" {
			healthColor := "42"
			if svc.health != "healthy" {
				healthColor = "214"
			}
			healthRender := lipgloss.NewStyle().Foreground(lipgloss.Color(healthColor)).Render(svc.health)
			info += fmt.Sprintf(" | Health: %s", healthRender)
		}
		
		// Add dependency info
		if depInfo, ok := depsInfo[svc.name]; ok {
			depStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Italic(true)
			info += "\n  " + depStyle.Render(depInfo)
		}

		s += fmt.Sprintf("%s %s\n", cursor, info)
	}

	// Actions
	actions := []string{
		"Start All (Core Services)",
		"Stop All",
		"Build & Start",
		"Start Processing (Auto-deps)",
		"Start Dashboard (Auto-deps + Browser)",
	}
	for i, action := range actions {
		cursor := " "
		if i+len(m.services) == m.selected {
			cursor = "▶"
		}
		s += fmt.Sprintf("%s %s\n", cursor, action)
	}

	return s
}

func (m model) renderLogsView() string {
	header := "📋 Logs"
	if m.logViewer != "" {
		header += fmt.Sprintf(": %s", m.logViewer)
	} else if m.selected < len(m.services) {
		header += fmt.Sprintf(": %s (Select service and press 'l')", m.services[m.selected].name)
	}

	logLines := []string{}
	if m.logViewer != "" {
		logLines = m.logs[m.logViewer]
		if len(logLines) > 50 {
			logLines = logLines[len(logLines)-50:] // Last 50 lines
		}
	}

	logContent := strings.Join(logLines, "\n")
	if logContent == "" {
		logContent = "No logs available. Select a service in Services view and press 'l' to view logs."
	}

	logsBox := boxStyle.Render(
		header + "\n\n" +
			lipgloss.NewStyle().
				Foreground(lipgloss.Color("240")).
				Render(logContent) +
			"\n\n" + m.renderHelp("Logs"),
	)
	return logsBox + "\n"
}

func (m model) renderStatsView() string {
	// System stats
	systemBox := boxStyle.Copy().Width(40).Render(
		"💻 System Resources\n\n" +
			fmt.Sprintf("CPU:  %s (%d cores)\n", formatPercent(m.stats.cpuPercent), m.stats.cpuCount) +
			fmt.Sprintf("RAM:  %s (%s / %s)\n",
				formatPercent(m.stats.memPercent),
				formatBytes(m.stats.memUsed),
				formatBytes(m.stats.memTotal)) +
			fmt.Sprintf("Disk: %s (%s / %s)\n",
				formatPercent(m.stats.diskPercent),
				formatBytes(m.stats.diskUsed),
				formatBytes(m.stats.diskTotal)) +
			fmt.Sprintf("\n%s", infoStyle.Render(fmt.Sprintf("Updated: %s", m.lastUpdate.Format("15:04:05")))),
	)

	// Container stats
	var containerInfo strings.Builder
	containerInfo.WriteString("🐳 Container Resources\n\n")
	for _, svc := range m.services {
		containerName := getContainerName(svc.name)
		if stat, ok := m.containerStats[containerName]; ok {
			statusColor := "42"
			if stat.status != "running" {
				statusColor = "196"
			}
			statusRender := lipgloss.NewStyle().Foreground(lipgloss.Color(statusColor)).Render(stat.status)
			containerInfo.WriteString(fmt.Sprintf("%s: CPU %s | RAM %s (%s)\n",
				svc.name,
				formatPercent(stat.cpuPercent),
				formatPercent(stat.memPercent),
				stat.memUsage,
				statusRender))
		}
	}

	containerBox := boxStyle.Copy().Width(40).Render(containerInfo.String())

	statsBox := lipgloss.JoinHorizontal(lipgloss.Top, systemBox, "  ", containerBox)
	return statsBox + "\n"
}

func (m model) renderGraphView() string {
	graphInfo := "🕸️  Knowledge Graph Statistics\n\n"
	graphInfo += fmt.Sprintf("Nodes:    %d\n", m.graphStats.nodeCount)
	graphInfo += fmt.Sprintf("Edges:    %d\n", m.graphStats.edgeCount)
	graphInfo += fmt.Sprintf("Last Update: %s\n", m.graphStats.lastUpdate)
	
	graphInfo += "\n📊 Entity Types:\n"
	graphInfo += "  • GeographicSoul (State, District, Pincode)\n"
	graphInfo += "  • IdentityLifecycle\n"
	graphInfo += "  • SystemicTension\n"
	graphInfo += "  • BehavioralSignature\n"
	graphInfo += "  • EmergentThreat\n"
	
	graphInfo += "\n🔗 Edge Types:\n"
	graphInfo += "  • LOCATED_IN, BORN_IN, EXPERIENCES\n"
	graphInfo += "  • MANIFESTS, REVEALS, SUGGESTS\n"
	graphInfo += "  • ECHOES, PRECEDES\n"
	
	graphInfo += "\n💡 Explore in Dashboard:\n"
	graphInfo += "  • Graph3DView: Interactive 3D visualization\n"
	graphInfo += "  • SemanticView: Semantic search with reasoning\n"
	graphInfo += "  • Map3DView: Geographic visualization with H3\n"
	
	graphBox := boxStyle.Render(graphInfo + "\n" + m.renderHelp("Graph"))
	return graphBox + "\n"
}

func (m model) renderConfigView() string {
	configBox := boxStyle.Render(
		"⚙️  Configuration\n\n" +
			"Docker Compose: docker-compose.yml\n" +
			"Atlas Engine: atlas-engine/config.yaml\n" +
			"Graph Ontology: config/graph/ontology.yaml\n" +
			"Dashboard: Environment variables in docker-compose.yml\n" +
			"\n" + m.renderHelp("Config"),
	)
	return configBox + "\n"
}

func (m model) renderDashboardView() string {
	dashboardInfo := "🌐 Atlas Dashboard - Advanced 3D Visualization Platform\n\n"
	
	// Check if dashboard is running
	dashboardRunning := false
	for _, svc := range m.services {
		if svc.name == "Atlas Dashboard" && svc.status == "running" {
			dashboardRunning = true
			break
		}
	}
	
	if dashboardRunning {
		dashboardInfo += "Status: " + successStyle.Render("● Running") + "\n"
		dashboardInfo += "Frontend: http://localhost:5173\n"
		dashboardInfo += "Backend API: http://localhost:8001\n\n"
	} else {
		dashboardInfo += "Status: " + errorStyle.Render("○ Stopped") + "\n"
		dashboardInfo += "Press 'd' to start the dashboard\n\n"
	}
	
	dashboardInfo += "📊 Available Views:\n\n"
	views := []struct {
		name        string
		description string
		icon        string
	}{
		{"Overview", "System stats and recent items", "📈"},
		{"Graph 3D", "Interactive 3D knowledge graph", "🕸️"},
		{"Map 3D", "Geographic visualization with H3 hexagons", "🗺️"},
		{"Anomalies", "Anomaly detection and analysis", "⚠️"},
		{"Clustering", "Cluster analysis and exploration", "🔗"},
		{"Patterns", "Behavioral pattern detection", "🔍"},
		{"Threats", "Emergent threat analysis", "🛡️"},
		{"Semantic", "Semantic search with reasoning", "🧠"},
	}
	
	for _, view := range views {
		dashboardInfo += fmt.Sprintf("  %s %s - %s\n", view.icon, view.name, view.description)
	}
	
	dashboardInfo += "\n✨ Features:\n"
	dashboardInfo += "  • H3 Geospatial Indexing (Uber's hexagonal grid)\n"
	dashboardInfo += "  • Semantic Search with LLM reasoning\n"
	dashboardInfo += "  • Graph Neighbor Exploration (depth 1-3)\n"
	dashboardInfo += "  • Real-time filtering and pagination\n"
	dashboardInfo += "  • Interactive 3D visualizations\n"
	dashboardInfo += "  • Evidence chain backtracking\n"
	dashboardInfo += "  • Autonomous setup (auto npm install)\n"
	dashboardInfo += "  • Hot Module Replacement (HMR) in dev mode\n"
	
	dashboardInfo += "\n🔧 API Endpoints:\n"
	dashboardInfo += "  • /api/graph/* - Graph queries\n"
	dashboardInfo += "  • /api/anomalies/* - Anomaly data\n"
	dashboardInfo += "  • /api/clusters/* - Cluster data\n"
	dashboardInfo += "  • /api/patterns/* - Pattern data\n"
	dashboardInfo += "  • /api/threats/* - Threat data\n"
	dashboardInfo += "  • /api/search - Semantic search\n"
	dashboardInfo += "  • /api/h3/* - H3 geospatial data\n"
	
	dashboardBox := boxStyle.Render(dashboardInfo + "\n" + m.renderHelp("Dashboard"))
	return dashboardBox + "\n"
}

func (m model) renderHelp(view string) string {
	help := ""
	switch view {
	case "Services":
		help = "↑/↓: Navigate | Enter: Toggle (auto-starts deps) | l: Logs | R: Restart | s: Start All | x: Stop All | b: Build | p: Process (auto-deps) | d: Dashboard (auto-deps) | r: Refresh | Tab: Switch View | q: Quit"
	case "Logs":
		help = "Tab: Switch View | q: Quit"
	case "Stats":
		help = "Tab: Switch View | r: Refresh | q: Quit"
	case "Graph":
		help = "Tab: Switch View | r: Refresh | q: Quit"
	case "Config":
		help = "Tab: Switch View | q: Quit"
	case "Pipeline":
		help = "Tab: Switch View | p: Start Processing | q: Quit"
	case "Dashboard":
		help = "Tab: Switch View | d: Start Dashboard | r: Refresh | q: Quit"
	}
	return infoStyle.Render(help)
}

func (m model) renderStatusBar() string {
	var statusRender string
	switch m.statusType {
	case "success":
		statusRender = successStyle.Render("✓ " + m.statusMsg)
	case "error":
		statusRender = errorStyle.Render("✗ " + m.statusMsg)
	case "warning":
		statusRender = warningStyle.Render("⚠ " + m.statusMsg)
	default:
		statusRender = infoStyle.Render(m.statusMsg)
	}
	return statusRender
}

func (m model) getMaxSelection() int {
	switch m.currentView {
	case viewServices:
		return len(m.services) + 4 // services + actions
	case viewLogs:
		return 0
	default:
		return 0
	}
}

func (m model) handleAction() tea.Cmd {
	if m.currentView == viewServices {
		if m.selected < len(m.services) {
			return toggleService(m.services[m.selected].name)
		} else {
			actionIdx := m.selected - len(m.services)
			switch actionIdx {
			case 0:
				return startServices()
			case 1:
				return stopServices()
			case 2:
				return buildServices()
			case 3:
				return startProcessing()
			case 4:
				return startDashboard()
			}
		}
	}
	return nil
}

// Service Management Functions

func checkServices() tea.Cmd {
	return func() tea.Msg {
		services := []service{
			{name: "Ollama", port: "11434", url: "http://localhost:11434"},
			{name: "FalkorDB", port: "6379", url: "http://localhost:3000"},
			{name: "Graphiti MCP", port: "8000", url: "http://localhost:8000"},
			{name: "Atlas Engine", port: "", url: ""},
			{name: "Atlas Dashboard", port: "5173 (UI) / 8001 (API)", url: "http://localhost:5173"},
		}

		containerMap := map[string]string{
			"Ollama":          "ollama",
			"FalkorDB":        "falkordb",
			"Graphiti MCP":    "graphiti-mcp",
			"Atlas Engine":    "atlas-engine",
			"Atlas Dashboard": "atlas-dashboard",
		}

		for i := range services {
			containerName := containerMap[services[i].name]
			if containerName != "" {
				if running, info := getContainerInfo(containerName); running {
					services[i].status = "running"
					services[i].containerID = info.id
					services[i].uptime = info.uptime
					services[i].health = info.health
				} else {
					services[i].status = "stopped"
				}
			}
		}

		return services
	}
}

type containerInfo struct {
	id     string
	uptime string
	health string
}

func getContainerInfo(containerName string) (bool, containerInfo) {
	// Check if running
	cmd := exec.Command("docker", "ps", "--format", "{{.Names}}")
	output, err := cmd.Output()
	if err != nil {
		return false, containerInfo{}
	}

	running := strings.Contains(string(output), containerName)
	if !running {
		return false, containerInfo{}
	}

	info := containerInfo{health: "unknown"}

	// Get container ID
	cmd = exec.Command("docker", "ps", "--filter", fmt.Sprintf("name=%s", containerName), "--format", "{{.ID}}")
	output, err = cmd.Output()
	if err == nil {
		info.id = strings.TrimSpace(string(output))
	}

	// Get uptime
	cmd = exec.Command("docker", "ps", "--filter", fmt.Sprintf("name=%s", containerName), "--format", "{{.Status}}")
	output, err = cmd.Output()
	if err == nil {
		status := strings.TrimSpace(string(output))
		if strings.Contains(status, "Up") {
			parts := strings.Fields(status)
			if len(parts) >= 3 {
				info.uptime = strings.Join(parts[1:len(parts)-1], " ")
			}
		}
		if strings.Contains(status, "health") {
			if strings.Contains(status, "healthy") {
				info.health = "healthy"
			} else {
				info.health = "unhealthy"
			}
		} else {
			info.health = "running"
		}
	}

	return true, info
}

func isContainerRunning(containerName string) bool {
	cmd := exec.Command("docker", "ps", "--format", "{{.Names}}")
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.Contains(string(output), containerName)
}

func getContainerName(serviceName string) string {
	containerMap := map[string]string{
		"Ollama":          "ollama",
		"FalkorDB":        "falkordb",
		"Graphiti MCP":    "graphiti-mcp",
		"Atlas Engine":    "atlas-engine",
		"Atlas Dashboard": "atlas-dashboard",
	}
	return containerMap[serviceName]
}

func startServices() tea.Cmd {
	return func() tea.Msg {
		// Start core services first (FalkorDB and Ollama)
		return tea.Batch(
			startServiceWithDeps("falkordb", []string{}),
			startServiceWithDeps("ollama", []string{}),
			func() tea.Msg { return statusMsg{message: "Starting core services (FalkorDB, Ollama)...", msgType: "info"} },
		)
	}
}

// startServiceWithDeps starts a service and its dependencies
func startServiceWithDeps(serviceName string, deps []string) tea.Cmd {
	return func() tea.Msg {
		// Start dependencies first
		for _, dep := range deps {
			if !isContainerRunning(dep) {
				cmd := exec.Command("docker", "compose", "up", "-d", dep)
				if err := cmd.Run(); err != nil {
					cmd = exec.Command("docker-compose", "up", "-d", dep)
					if err := cmd.Run(); err != nil {
						return statusMsg{message: fmt.Sprintf("Failed to start dependency %s: %v", dep, err), msgType: "error"}
					}
				}
				// Wait for health check
				waitForHealth(dep, 30*time.Second)
			}
		}

		// Start the service
		if !isContainerRunning(serviceName) {
			cmd := exec.Command("docker", "compose", "up", "-d", serviceName)
			if err := cmd.Run(); err != nil {
				cmd = exec.Command("docker-compose", "up", "-d", serviceName)
				if err := cmd.Run(); err != nil {
					return statusMsg{message: fmt.Sprintf("Failed to start %s: %v", serviceName, err), msgType: "error"}
				}
			}
		}

		time.Sleep(1 * time.Second)
		return checkServices()
	}
}

// waitForHealth waits for a container to become healthy
func waitForHealth(containerName string, timeout time.Duration) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if running, info := getContainerInfo(containerName); running && info.health == "healthy" {
			return
		}
		time.Sleep(2 * time.Second)
	}
}

func stopServices() tea.Cmd {
	return func() tea.Msg {
		cmd := exec.Command("docker", "compose", "down")
		if err := cmd.Run(); err != nil {
			cmd = exec.Command("docker-compose", "down")
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to stop services: %v", err), msgType: "error"}
			}
		}

		time.Sleep(1 * time.Second)
		return tea.Batch(
			checkServices(),
			func() tea.Msg { return statusMsg{message: "Services stopped", msgType: "success"} },
		)
	}
}

func buildServices() tea.Cmd {
	return func() tea.Msg {
		cmd := exec.Command("docker", "compose", "build")
		if err := cmd.Run(); err != nil {
			cmd = exec.Command("docker-compose", "build")
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to build services: %v", err), msgType: "error"}
			}
		}

		cmd = exec.Command("docker", "compose", "up", "-d")
		if err := cmd.Run(); err != nil {
			cmd = exec.Command("docker-compose", "up", "-d")
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to start services: %v", err), msgType: "error"}
			}
		}

		time.Sleep(3 * time.Second)
		return tea.Batch(
			checkServices(),
			func() tea.Msg { return statusMsg{message: "Services built and started", msgType: "success"} },
		)
	}
}

func toggleService(name string) tea.Cmd {
	return func() tea.Msg {
		containerName := getContainerName(name)
		if containerName == "" {
			return statusMsg{message: fmt.Sprintf("Unknown service: %s", name), msgType: "error"}
		}

		var cmd *exec.Cmd
		if isContainerRunning(containerName) {
			// Stop service
			cmd = exec.Command("docker", "stop", containerName)
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to stop %s: %v", name, err), msgType: "error"}
			}
			time.Sleep(1 * time.Second)
			return tea.Batch(
				checkServices(),
				func() tea.Msg { return statusMsg{message: fmt.Sprintf("%s stopped", name), msgType: "success"} },
			)
		} else {
			// Start service with dependencies
			return startServiceIntelligent(name)
		}
	}
}

// startServiceIntelligent starts a service and its dependencies automatically
func startServiceIntelligent(serviceName string) tea.Cmd {
	return func() tea.Msg {
		containerName := getContainerName(serviceName)
		if containerName == "" {
			return statusMsg{message: fmt.Sprintf("Unknown service: %s", serviceName), msgType: "error"}
		}

		// Define service dependencies
		dependencies := map[string][]string{
			"graphiti-mcp": {"falkordb", "ollama"},
			"atlas-engine": {"graphiti-mcp", "falkordb"},
			"atlas-dashboard": {"graphiti-mcp", "falkordb"},
		}

		// Start dependencies first
		if deps, ok := dependencies[containerName]; ok {
			for _, dep := range deps {
				if !isContainerRunning(dep) {
					cmd := exec.Command("docker", "compose", "up", "-d", dep)
					if err := cmd.Run(); err != nil {
						cmd = exec.Command("docker-compose", "up", "-d", dep)
						if err := cmd.Run(); err != nil {
							return statusMsg{message: fmt.Sprintf("Failed to start dependency %s: %v", dep, err), msgType: "error"}
						}
					}
					// Wait for health check (with timeout)
					waitForHealth(dep, 60*time.Second)
				}
			}
		}

		// Start the service
		var cmd *exec.Cmd
		if containerName == "atlas-engine" {
			cmd = exec.Command("docker", "compose", "--profile", "processing", "up", "-d", containerName)
		} else if containerName == "atlas-dashboard" {
			cmd = exec.Command("docker", "compose", "--profile", "dashboard", "up", "-d", containerName)
		} else {
			cmd = exec.Command("docker", "compose", "up", "-d", containerName)
		}

		if err := cmd.Run(); err != nil {
			// Try docker-compose fallback
			if containerName == "atlas-engine" {
				cmd = exec.Command("docker-compose", "--profile", "processing", "up", "-d", containerName)
			} else if containerName == "atlas-dashboard" {
				cmd = exec.Command("docker-compose", "--profile", "dashboard", "up", "-d", containerName)
			} else {
				cmd = exec.Command("docker-compose", "up", "-d", containerName)
			}
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to start %s: %v", serviceName, err), msgType: "error"}
			}
		}

		time.Sleep(2 * time.Second)

		// Special handling for dashboard
		if containerName == "atlas-dashboard" {
			// Open browser
			go func() {
				time.Sleep(3 * time.Second)
				url := "http://localhost:5173"
				var openCmd *exec.Cmd
				switch runtime.GOOS {
				case "darwin":
					openCmd = exec.Command("open", url)
				case "linux":
					openCmd = exec.Command("xdg-open", url)
				case "windows":
					openCmd = exec.Command("cmd", "/c", "start", url)
				}
				if openCmd != nil {
					openCmd.Run()
				}
			}()
			return tea.Batch(
				checkServices(),
				func() tea.Msg {
					return statusMsg{message: fmt.Sprintf("%s started at http://localhost:5173 (API: http://localhost:8001)", serviceName), msgType: "success"}
				},
			)
		}

		return tea.Batch(
			checkServices(),
			func() tea.Msg { return statusMsg{message: fmt.Sprintf("%s started", serviceName), msgType: "success"} },
		)
	}
}

func restartService(name string) tea.Cmd {
	return func() tea.Msg {
		containerName := getContainerName(name)
		if containerName == "" {
			return statusMsg{message: fmt.Sprintf("Unknown service: %s", name), msgType: "error"}
		}

		cmd := exec.Command("docker", "restart", containerName)
		if err := cmd.Run(); err != nil {
			return statusMsg{message: fmt.Sprintf("Failed to restart %s: %v", name, err), msgType: "error"}
		}

		time.Sleep(2 * time.Second)
		return tea.Batch(
			checkServices(),
			func() tea.Msg { return statusMsg{message: fmt.Sprintf("%s restarted", name), msgType: "success"} },
		)
	}
}

func startProcessing() tea.Cmd {
	return func() tea.Msg {
		// Ensure dependencies are running
		if !isContainerRunning("graphiti-mcp") || !isContainerRunning("falkordb") {
			return tea.Batch(
				startServiceIntelligent("Graphiti MCP"),
				func() tea.Msg { return statusMsg{message: "Starting dependencies for processing...", msgType: "info"} },
			)
		}

		// Start processing
		cmd := exec.Command("docker", "compose", "--profile", "processing", "up", "-d", "atlas-engine")
		if err := cmd.Run(); err != nil {
			cmd = exec.Command("docker-compose", "--profile", "processing", "up", "-d", "atlas-engine")
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to start processing: %v", err), msgType: "error"}
			}
		}

		time.Sleep(2 * time.Second)
		return tea.Batch(
			checkServices(),
			func() tea.Msg { return statusMsg{message: "Processing pipeline started (check logs for progress)", msgType: "success"} },
		)
	}
}

func startDashboard() tea.Cmd {
	return func() tea.Msg {
		// Ensure dependencies are running first
		if !isContainerRunning("graphiti-mcp") || !isContainerRunning("falkordb") {
			return tea.Batch(
				startServiceIntelligent("Graphiti MCP"),
				func() tea.Msg { return statusMsg{message: "Starting dependencies for dashboard...", msgType: "info"} },
			)
		}

		// Build dashboard if needed (autonomous - Docker handles npm install)
		cmd := exec.Command("docker", "compose", "--profile", "dashboard", "build", "atlas-dashboard")
		if _, err := cmd.CombinedOutput(); err != nil {
			// Try docker-compose if docker compose fails
			cmd = exec.Command("docker-compose", "--profile", "dashboard", "build", "atlas-dashboard")
			if output2, err2 := cmd.CombinedOutput(); err2 != nil {
				return statusMsg{message: fmt.Sprintf("Failed to build dashboard: %v\n%s", err2, string(output2)), msgType: "error"}
			}
		}
		
		// Start the container
		cmd = exec.Command("docker", "compose", "--profile", "dashboard", "up", "-d", "atlas-dashboard")
		if err := cmd.Run(); err != nil {
			cmd = exec.Command("docker-compose", "--profile", "dashboard", "up", "-d", "atlas-dashboard")
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to start dashboard: %v", err), msgType: "error"}
			}
		}

		time.Sleep(3 * time.Second)
		
		// Try to open browser (platform-independent)
		go func() {
			time.Sleep(2 * time.Second) // Give services a moment to start
			url := "http://localhost:5173"
			var openCmd *exec.Cmd
			switch runtime.GOOS {
			case "darwin":
				openCmd = exec.Command("open", url)
			case "linux":
				openCmd = exec.Command("xdg-open", url)
			case "windows":
				openCmd = exec.Command("cmd", "/c", "start", url)
			}
			if openCmd != nil {
				openCmd.Run()
			}
		}()
		
		return tea.Batch(
			checkServices(),
			func() tea.Msg {
				return statusMsg{message: "Dashboard started at http://localhost:5173 (API: http://localhost:8001)", msgType: "success"}
			},
		)
	}
}

func installDashboardDeps() tea.Cmd {
	return func() tea.Msg {
		// Install dependencies in dashboard container or locally
		cmd := exec.Command("docker", "exec", "atlas-dashboard", "npm", "install", "--legacy-peer-deps")
		if err := cmd.Run(); err != nil {
			// If container not running, try local install
			cmd = exec.Command("sh", "-c", "cd atlas-dashboard && npm install --legacy-peer-deps")
			if err := cmd.Run(); err != nil {
				return statusMsg{message: fmt.Sprintf("Failed to install dependencies: %v", err), msgType: "error"}
			}
		}
		return statusMsg{message: "Dashboard dependencies installed", msgType: "success"}
	}
}

func buildDashboard() tea.Cmd {
	return func() tea.Msg {
		// Build dashboard (autonomous)
		cmd := exec.Command("docker", "compose", "--profile", "dashboard", "build", "atlas-dashboard")
		if _, err := cmd.CombinedOutput(); err != nil {
			cmd = exec.Command("docker-compose", "--profile", "dashboard", "build", "atlas-dashboard")
			if output2, err2 := cmd.CombinedOutput(); err2 != nil {
				return statusMsg{message: fmt.Sprintf("Failed to build dashboard: %v\n%s", err2, string(output2)), msgType: "error"}
			}
		}
		return statusMsg{message: "Dashboard built successfully", msgType: "success"}
	}
}

// Logs

type logMsg struct {
	service string
	lines   []string
}

func fetchLogs(serviceName string) tea.Cmd {
	return func() tea.Msg {
		containerName := getContainerName(serviceName)
		if containerName == "" {
			return logMsg{service: serviceName, lines: []string{"Service not found"}}
		}

		cmd := exec.Command("docker", "logs", "--tail", "50", containerName)
		output, err := cmd.Output()
		if err != nil {
			return logMsg{service: serviceName, lines: []string{fmt.Sprintf("Error fetching logs: %v", err)}}
		}

		lines := strings.Split(string(output), "\n")
		return logMsg{service: serviceName, lines: lines}
	}
}

// Stats

func updateStats() tea.Cmd {
	return func() tea.Msg {
		ctx := context.Background()

		// CPU
		cpuPercent, _ := cpu.PercentWithContext(ctx, time.Second, false)
		cpuVal := 0.0
		if len(cpuPercent) > 0 {
			cpuVal = cpuPercent[0]
		}
		cpuCount, _ := cpu.CountsWithContext(ctx, false)

		// Memory
		memInfo, _ := mem.VirtualMemoryWithContext(ctx)
		memVal := 0.0
		memTotal := uint64(0)
		memUsed := uint64(0)
		if memInfo != nil {
			memVal = memInfo.UsedPercent
			memTotal = memInfo.Total
			memUsed = memInfo.Used
		}

		// Disk
		diskInfo, _ := disk.UsageWithContext(ctx, "/")
		diskVal := 0.0
		diskTotal := uint64(0)
		diskUsed := uint64(0)
		if diskInfo != nil {
			diskVal = diskInfo.UsedPercent
			diskTotal = diskInfo.Total
			diskUsed = diskInfo.Used
		}

		return systemStats{
			cpuPercent:  cpuVal,
			cpuCount:    cpuCount,
			memPercent:  memVal,
			memTotal:    memTotal,
			memUsed:     memUsed,
			diskPercent: diskVal,
			diskTotal:   diskTotal,
			diskUsed:    diskUsed,
		}
	}
}

func updateContainerStats() tea.Cmd {
	return func() tea.Msg {
		stats := make(map[string]containerStat)

		// Get stats for all containers
		cmd := exec.Command("docker", "stats", "--no-stream", "--format", "{{.Name}} {{.CPUPerc}} {{.MemPerc}} {{.MemUsage}} {{.Status}}")
		output, err := cmd.Output()
		if err != nil {
			return stats
		}

		lines := strings.Split(strings.TrimSpace(string(output)), "\n")
		for _, line := range lines {
			fields := strings.Fields(line)
			if len(fields) >= 5 {
				name := fields[0]
				var cpuPercent, memPercent float64
				fmt.Sscanf(fields[1], "%f%%", &cpuPercent)
				fmt.Sscanf(fields[2], "%f%%", &memPercent)
				memUsage := fields[3]
				status := strings.Join(fields[4:], " ")

				stats[name] = containerStat{
					cpuPercent: cpuPercent,
					memPercent: memPercent,
					memUsage:   memUsage,
					status:     status,
				}
			}
		}

		return stats
	}
}

// Graph Stats

func updateGraphStats() tea.Cmd {
	return func() tea.Msg {
		// Try to get stats from FalkorDB
		// For now, return placeholder
		return graphStats{
			nodeCount:  0,
			edgeCount:  0,
			lastUpdate: "Never",
		}
	}
}

// Utility Functions

func tick() tea.Cmd {
	return tea.Tick(2*time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func formatPercent(p float64) string {
	color := "42" // green
	if p > 80 {
		color = "196" // red
	} else if p > 60 {
		color = "214" // yellow
	}
	return lipgloss.NewStyle().Foreground(lipgloss.Color(color)).Render(fmt.Sprintf("%.1f%%", p))
}

func formatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

func main() {
	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}

func (m model) renderPipelineView() string {
	pipelineBox := boxStyle.Render(
		"⚙️  Processing Pipeline\n\n" +
			"Status: Check Atlas Engine logs\n" +
			"Checkpoints: /app/processed/checkpoints\n" +
			"Mode: Start Fresh / Resume\n" +
			"\n" + m.renderHelp("Pipeline"),
	)
	return pipelineBox + "\n"
}
