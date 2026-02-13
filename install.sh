#!/bin/bash

set -e

INSTALL_DIR="/opt/whale-panel"
REPO_URL="https://raw.githubusercontent.com/primeZdev/whale-panel/main"
DOCKER_IMAGE="primezdev/whale-panel:latest"

print_status() { echo "[*] $1"; }
print_success() { echo -e "\033[32m[OK] $1\033[0m"; }
print_error() { echo "[ERROR] $1"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        return
    fi

    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed successfully"
}

setup_directory() {
    print_status "Setting up installation directory..."
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    print_success "Directory ready: $INSTALL_DIR"
}

download_files() {
    print_status "Downloading configuration files..."
    curl -fsSL "$REPO_URL/docker-compose.yml" -o docker-compose.yml
    curl -fsSL "$REPO_URL/.env.example" -o .env.example
    print_success "Files downloaded"
}

configure_env() {
    print_status "Configuring environment..."
    echo ""

    read -p "Enter admin username: " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}

    read -sp "Enter admin password: " ADMIN_PASS
    ADMIN_PASS=${ADMIN_PASS:-admin}
    echo ""

    read -p "Enter panel port [8000]: " PANEL_PORT
    PANEL_PORT=${PANEL_PORT:-8000}

    read -p "Enter URL path [dashboard]: " URL_PATH
    URL_PATH=${URL_PATH:-dashboard}

    JWT_SECRET=$(openssl rand -hex 32)

    cp .env.example .env
    
    # Replace values in .env
    sed -i "s/^ADMIN_USERNAME=.*/ADMIN_USERNAME=$ADMIN_USER/" .env
    sed -i "s/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASS/" .env
    sed -i "s/^PORT=.*/PORT=$PANEL_PORT/" .env
    sed -i "s/^URLPATH=.*/URLPATH=$URL_PATH/" .env
    sed -i "s/^JWT_SECRET_KEY=.*/JWT_SECRET_KEY=\"$JWT_SECRET\"/" .env

    print_success "Configuration saved"
}

pull_and_run() {
    print_status "Pulling Docker image..."
    docker pull "$DOCKER_IMAGE"
    
    print_status "Starting Whale Panel..."
    docker compose up -d
    
    trap 'show_info; exit 0' INT
    docker compose logs -f
}

show_info() {
    local PORT=$(grep "^PORT=" .env | cut -d'=' -f2)
    local URLPATH=$(grep "^URLPATH=" .env | cut -d'=' -f2)
    local IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo ""
    echo "========================================"
    echo "   Installation Complete!"
    echo "========================================"
    echo ""
    echo -e "\033[32m  Panel URL: http://$IP:$PORT/$URLPATH/login\033[0m"
    echo ""
    echo "  Commands:"
    echo "    whale-panel update"
    echo "    whale-panel stop"
    echo "    whale-panel start"
    echo "    whale-panel logs"
    echo ""
}

install_command() {
    cat > /usr/local/bin/whale-panel << 'SCRIPT'
#!/bin/bash
cd /opt/whale-panel

case "$1" in
    edit-env)
        nano .env
        ;;
    update)
        echo "Updating Whale Panel..."
        docker compose pull
        docker compose up -d
        echo "Update complete!"
        docker compose logs -f
        ;;
    stop)
        docker compose down
        echo "Whale Panel stopped"
        ;;
    start)
        docker compose up -d
        echo "Whale Panel started"
        ;;
    restart)
        docker compose restart
        echo "Whale Panel restarted"
        docker compose logs -f
        ;;
    logs)
        docker compose logs -f
        ;;
    uninstall)
        docker compose down
        rm -rf /opt/whale-panel
        rm -f /usr/local/bin/whale-panel
        echo "Whale Panel uninstalled"
        ;;
    *)
        echo "Usage: whale-panel {edit-env|update|start|stop|restart|logs|uninstall}"
        ;;
esac
SCRIPT
    chmod +x /usr/local/bin/whale-panel
}

main() {
    echo "Whale Panel Installer"
    echo ""
    check_root
    install_docker
    setup_directory
    download_files
    configure_env
    install_command
    pull_and_run
}

main
