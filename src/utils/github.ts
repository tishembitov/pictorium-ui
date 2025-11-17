// Fetch GitHub repository stats (из старого PortfolioView.vue)
export interface GitHubRepoStats {
  stars: number
  forks: number
}

export async function fetchRepoStats(repoUrl: string): Promise<GitHubRepoStats> {
  try {
    const repoPath = new URL(repoUrl).pathname.slice(1) // 'user/repo'
    const response = await fetch(`https://api.github.com/repos/${repoPath}`)

    if (!response.ok) {
      throw new Error('GitHub API error')
    }

    const data = await response.json()

    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
    }
  } catch (error) {
    console.error('Error fetching GitHub stats:', error)
    return {
      stars: 0,
      forks: 0,
    }
  }
}

// Fetch multiple repos stats
export async function fetchMultipleRepoStats(repoUrls: string[]): Promise<GitHubRepoStats[]> {
  const promises = repoUrls.map((url) => fetchRepoStats(url))
  return Promise.all(promises)
}

// Format GitHub URL
export function formatGitHubUrl(username: string, repo: string): string {
  return `https://github.com/${username}/${repo}`
}

// Extract username and repo from URL
export function parseGitHubUrl(url: string): { username: string; repo: string } | null {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname.split('/').filter(Boolean)

    if (parts.length >= 2) {
      return {
        username: parts[0],
        repo: parts[1],
      }
    }

    return null
  } catch {
    return null
  }
}
