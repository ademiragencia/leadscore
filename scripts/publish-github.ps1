param(
  [string]$RepoName = "leadscore-empresas",
  [string]$Description = "LeadScore Empresas - SaaS de prospeccao B2B com score, CRM e base nacional",
  [switch]$Private
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git nao encontrado no PATH. Instale o Git for Windows antes de publicar."
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) nao encontrado no PATH. Instale e rode: gh auth login"
}

gh auth status | Out-Host

if (-not (Test-Path ".git") -or -not (Test-Path ".git\HEAD")) {
  git init
}

$branch = (git branch --show-current)
if ([string]::IsNullOrWhiteSpace($branch)) {
  git checkout -b main
} elseif ($branch -ne "main") {
  git branch -M main
}

git add README.md INTEGRACOES.md package.json .env.example .gitignore outputs server scripts
git commit -m "Initial LeadScore Empresas SaaS" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Nada novo para commitar ou commit ja existe."
}

$visibility = if ($Private) { "--private" } else { "--public" }
$repoExists = $false
try {
  gh repo view $RepoName *> $null
  $repoExists = $true
} catch {
  $repoExists = $false
}

if (-not $repoExists) {
  gh repo create $RepoName $visibility --description $Description --source . --remote origin --push
} else {
  if (-not (git remote get-url origin 2>$null)) {
    $owner = (gh api user --jq ".login")
    git remote add origin "https://github.com/$owner/$RepoName.git"
  }
  git push -u origin main
}

gh repo view $RepoName --web
