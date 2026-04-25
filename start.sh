#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  BDC App — Console de gestion
# ══════════════════════════════════════════════════════════════

set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
MOBILE="$ROOT/mobile"

# ── Couleurs & styles ─────────────────────────────────────────
R='\033[0m'        # reset
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
LGREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
RED='\033[1;31m'
GRAY='\033[0;90m'
WHITE='\033[1;37m'
PINK='\033[38;5;211m'

# ── Helpers ───────────────────────────────────────────────────
clear_screen() { clear; }

print_header() {
  echo ""
  echo -e "  ${PINK}${BOLD}╔══════════════════════════════════════════════════╗${R}"
  echo -e "  ${PINK}${BOLD}║${R}                                                  ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${WHITE}${BOLD}  ██████╗ ██████╗  ██████╗               ${R}    ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${WHITE}${BOLD}  ██╔══██╗██╔══██╗██╔════╝               ${R}    ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${WHITE}${BOLD}  ██████╔╝██║  ██║██║                    ${R}    ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${WHITE}${BOLD}  ██╔══██╗██║  ██║██║                    ${R}    ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${WHITE}${BOLD}  ██████╔╝██████╔╝╚██████╗               ${R}    ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${WHITE}${BOLD}  ╚═════╝ ╚═════╝  ╚═════╝               ${R}    ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}                                                  ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}   ${GRAY}Console de gestion — Beauté du Cil App${R}        ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}║${R}                                                  ${PINK}${BOLD}║${R}"
  echo -e "  ${PINK}${BOLD}╚══════════════════════════════════════════════════╝${R}"
  echo ""
}

separator() {
  echo -e "  ${GRAY}──────────────────────────────────────────────────${R}"
}

step()    { echo -e "  ${CYAN}${BOLD}›${R} $*"; }
ok()      { echo -e "  ${LGREEN}${BOLD}✔${R}  $*"; }
warn()    { echo -e "  ${YELLOW}${BOLD}⚠${R}  $*"; }
fail()    { echo -e "  ${RED}${BOLD}✖${R}  $*"; }
info()    { echo -e "  ${GRAY}   $*${R}"; }

# ── IP locale ─────────────────────────────────────────────────
get_local_ip() {
  local ip
  ip=$(ipconfig getifaddr en0 2>/dev/null || true)
  [[ -z "$ip" ]] && ip=$(ipconfig getifaddr en1 2>/dev/null || true)
  [[ -z "$ip" ]] && ip=$(ifconfig | awk '/inet / && !/127\.0\.0\.1/ {print $2; exit}')
  echo "$ip"
}

# ── Statut des services ───────────────────────────────────────
status_docker() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "bdc-app-api" && echo "running" || echo "stopped"
}

status_db() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "bdc-app-db" && echo "running" || echo "stopped"
}

status_expo() {
  pgrep -f "expo start" &>/dev/null && echo "running" || echo "stopped"
}

badge_service() {
  local name="$1" state="$2"
  if [[ "$state" == "running" ]]; then
    echo -e "  ${GREEN}${BOLD}●${R} ${WHITE}${BOLD}$name${R}  ${LGREEN}en ligne${R}"
  else
    echo -e "  ${RED}${BOLD}○${R} ${WHITE}${BOLD}$name${R}  ${GRAY}arrêté${R}"
  fi
}

show_status() {
  local ip
  ip=$(get_local_ip)
  echo ""
  echo -e "  ${BOLD}${WHITE}État des services${R}"
  separator
  badge_service "Base de données (PostgreSQL)" "$(status_db)"
  badge_service "API Backend (Docker)"         "$(status_docker)"
  badge_service "Expo (Mobile)"                "$(status_expo)"
  separator
  if [[ -n "$ip" ]]; then
    echo -e "  ${GRAY}IP locale  :${R}  ${CYAN}${BOLD}$ip${R}"
    echo -e "  ${GRAY}API        :${R}  ${CYAN}http://localhost:4000${R}"
    echo -e "  ${GRAY}Admin      :${R}  ${CYAN}http://localhost:4000/admin${R}"
  fi
  echo ""
}

# ── Docker / Backend ──────────────────────────────────────────
ensure_docker_running() {
  if ! docker info &>/dev/null 2>&1; then
    warn "Docker Desktop n'est pas lancé — ouverture en cours…"
    open -a Docker
    echo -ne "  ${CYAN}›${R}  Attente de Docker"
    until docker info &>/dev/null 2>&1; do
      echo -n "."
      sleep 2
    done
    echo ""
    ok "Docker Desktop est prêt"
  fi
}

free_port_4000() {
  local pid
  pid=$(lsof -ti :4000 2>/dev/null || true)
  if [[ -n "$pid" ]]; then
    warn "Port 4000 occupé (PID $pid) — libération…"
    kill "$pid" 2>/dev/null || true
    sleep 1
    ok "Port 4000 libéré"
  fi
}

start_backend() {
  echo ""
  echo -e "  ${BOLD}${WHITE}Démarrage du backend${R}"
  separator

  step "Vérification de Docker…"
  ensure_docker_running

  step "Vérification du port 4000…"
  free_port_4000

  step "Lancement des containers (db + api)…"
  cd "$ROOT"
  if docker compose up -d --build 2>&1 | grep -E "Built|Started|Recreated|Running" | \
      sed "s/^/  ${GRAY}  /" | sed "s/$/${R}/" ; then
    true
  fi

  step "Attente que l'API soit prête…"
  local max=30 count=0
  echo -ne "  ${CYAN}›${R}  Chargement"
  until curl -sf "http://localhost:4000/health" &>/dev/null; do
    echo -n "."
    sleep 2
    count=$((count + 1))
    if [[ $count -ge $max ]]; then
      echo ""
      fail "L'API ne répond pas. Logs : ${BOLD}docker logs bdc-app-api-1${R}"
      return 1
    fi
  done
  echo ""

  echo ""
  ok "${BOLD}Base de données${R}  démarrée"
  ok "${BOLD}API Backend${R}      opérationnelle  →  ${CYAN}http://localhost:4000${R}"
  ok "${BOLD}Admin panel${R}      accessible      →  ${CYAN}http://localhost:4000/admin${R}"
}

stop_backend() {
  echo ""
  echo -e "  ${BOLD}${WHITE}Arrêt du backend${R}"
  separator
  step "Arrêt des containers Docker…"
  cd "$ROOT"
  docker compose down 2>&1 | grep -E "Stopping|Removed|stopped" | \
    sed "s/^/  ${GRAY}  /" | sed "s/$/${R}/" || true
  echo ""
  ok "${BOLD}Base de données${R}  arrêtée"
  ok "${BOLD}API Backend${R}      arrêtée"
}

open_chrome_admin() {
  local url="http://localhost:4000/admin"
  step "Ouverture de Chrome → $url"
  if open -a "Google Chrome" "$url" 2>/dev/null; then
    ok "Google Chrome ouvert sur le panel admin"
  else
    warn "Google Chrome introuvable — ouverture avec le navigateur par défaut"
    open "$url"
  fi
}

reload_backend() {
  echo ""
  echo -e "  ${BOLD}${WHITE}Rechargement des serveurs${R}"
  separator

  step "Arrêt des containers…"
  cd "$ROOT"
  docker compose down 2>&1 | grep -E "Stopping|Removed|stopped" | \
    sed "s/^/  ${GRAY}  /" | sed "s/$/${R}/" || true

  step "Relance des containers (db + api)…"
  docker compose up -d --build 2>&1 | grep -E "Built|Started|Recreated|Running" | \
    sed "s/^/  ${GRAY}  /" | sed "s/$/${R}/" || true

  step "Attente que l'API soit prête…"
  local max=30 count=0
  echo -ne "  ${CYAN}›${R}  Chargement"
  until curl -sf "http://localhost:4000/health" &>/dev/null; do
    echo -n "."
    sleep 2
    count=$((count + 1))
    if [[ $count -ge $max ]]; then
      echo ""
      fail "L'API ne répond pas. Logs : ${BOLD}docker logs bdc-app-api-1${R}"
      return 1
    fi
  done
  echo ""

  # Ouvre Chrome sur l'admin avec un paramètre timestamp pour bypasser le cache navigateur
  local url="http://localhost:4000/admin?v=$(date +%s)"
  osascript <<APPLESCRIPT 2>/dev/null || open -a "Google Chrome" "$url" 2>/dev/null || open "$url"
tell application "Google Chrome"
  activate
  if (count of windows) > 0 then
    set URL of active tab of front window to "$url"
  else
    open location "$url"
  end if
end tell
APPLESCRIPT

  echo ""
  ok "${BOLD}Serveurs rechargés${R}  →  ${CYAN}http://localhost:4000/admin${R}"
  info "La page admin a été rouverte avec le cache vidé"
}

# ── Expo / Mobile ─────────────────────────────────────────────
start_expo() {
  local ip
  ip=$(get_local_ip)

  if [[ -z "$ip" ]]; then
    fail "IP locale introuvable. Vérifie ta connexion Wi-Fi."
    return 1
  fi

  echo ""
  echo -e "  ${BOLD}${WHITE}Démarrage d'Expo${R}"
  separator
  step "IP locale détectée : ${BOLD}$ip${R}"
  step "Lancement d'Expo dans un nouveau terminal…"

  # Ouvre un nouveau Terminal avec Expo
  osascript <<EOF
tell application "Terminal"
  activate
  do script "echo '' && echo '  BDC App — Expo / Mobile' && echo '' && cd '$MOBILE' && EXPO_PUBLIC_API_URL='http://$ip:4000' npx expo start -c"
  set frontmost to true
end tell
EOF

  sleep 2
  if status_expo | grep -q "running"; then
    ok "${BOLD}Expo${R}  démarré  →  API : ${CYAN}http://$ip:4000${R}"
    info "Scanner le QR code dans le terminal Expo avec l'app Expo Go"
  else
    warn "Expo est en cours de démarrage dans le terminal dédié"
  fi
}

stop_expo() {
  echo ""
  echo -e "  ${BOLD}${WHITE}Arrêt d'Expo${R}"
  separator
  local pids
  pids=$(pgrep -f "expo start" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    step "Arrêt des processus Expo…"
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
    ok "${BOLD}Expo${R}  arrêté"
  else
    warn "Expo ne semble pas être en cours d'exécution"
  fi
}

# ── Menu principal ────────────────────────────────────────────
show_menu() {
  echo ""
  echo -e "  ${BOLD}${WHITE}Que voulez-vous faire ?${R}"
  separator
  echo -e "  ${BOLD}${CYAN} 1${R}  🚀  Démarrer ${BOLD}tous${R} les services  ${GRAY}(backend + expo + chrome)${R}"
  echo -e "  ${BOLD}${CYAN} 2${R}  🛑  Arrêter  ${BOLD}tous${R} les services"
  separator
  echo -e "  ${BOLD}${CYAN} 3${R}  🐳  Démarrer le backend uniquement  ${GRAY}(Docker + API)${R}"
  echo -e "  ${BOLD}${CYAN} 4${R}  📱  Démarrer Expo uniquement"
  echo -e "  ${BOLD}${CYAN} 5${R}  🌐  Ouvrir l'admin dans Chrome"
  separator
  echo -e "  ${BOLD}${CYAN} 6${R}  📊  Statut des services"
  echo -e "  ${BOLD}${CYAN} 7${R}  📋  Logs de l'API  ${GRAY}(50 dernières lignes)${R}"
  echo -e "  ${BOLD}${CYAN} 8${R}  🔄  Rechargement des serveurs  ${GRAY}(redémarre + vide le cache)${R}"
  separator
  echo -e "  ${BOLD}${CYAN} 0${R}  ✕   Quitter"
  echo ""
  echo -ne "  ${BOLD}Votre choix :${R}  "
}

# ── Boucle principale ─────────────────────────────────────────
main() {
  clear_screen
  print_header
  show_status

  while true; do
    show_menu
    read -r choice

    case "$choice" in

      1)
        clear_screen
        print_header
        start_backend  || true
        echo ""
        open_chrome_admin
        sleep 1
        start_expo     || true
        echo ""
        separator
        ok "${BOLD}Tous les services sont démarrés.${R}"
        separator
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      2)
        clear_screen
        print_header
        stop_expo    || true
        stop_backend || true
        echo ""
        separator
        ok "${BOLD}Tous les services sont arrêtés.${R}"
        separator
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      3)
        clear_screen
        print_header
        start_backend || true
        echo ""
        open_chrome_admin
        echo ""
        separator
        ok "${BOLD}Backend démarré.${R}"
        separator
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      4)
        clear_screen
        print_header
        start_expo || true
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      5)
        clear_screen
        print_header
        open_chrome_admin
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      6)
        clear_screen
        print_header
        show_status
        ;;

      7)
        clear_screen
        print_header
        echo ""
        echo -e "  ${BOLD}${WHITE}Logs API (50 dernières lignes)${R}"
        separator
        docker logs bdc-app-api-1 --tail=50 2>&1 | sed "s/^/  ${GRAY}/" | sed "s/$/${R}/" || \
          fail "Container introuvable — le backend est-il démarré ?"
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      8)
        clear_screen
        print_header
        reload_backend || true
        echo ""
        separator
        echo ""
        read -rp "  Appuyez sur Entrée pour revenir au menu…" _
        clear_screen
        print_header
        show_status
        ;;

      0)
        clear_screen
        echo ""
        echo -e "  ${PINK}${BOLD}Au revoir !${R}"
        echo ""
        exit 0
        ;;

      *)
        warn "Option invalide. Entrez un chiffre entre 0 et 8."
        ;;
    esac
  done
}

main
