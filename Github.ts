export interface User {
    login: string
    id: number
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
}
export interface Label {
    id: number
    url: string
    name: string
    color: string
    default: boolean
}
export interface Commit {
    label: string
    ref: string
    sha: string
    user: User,
    repo: Repository
}
export interface Milestone {}
export interface Issue {
    url: string
    labels_url: string
    comments_url: string
    events_url: string
    html_url: string
    id: number
    number: number
    title: string
    user: User
    labels: Label[]
    state: string
    locked: boolean
    assignee?: User
    milestone?: Milestone
    comments: number
    closed_at?: string
    merged_at?: string
    updated_at?: string
    body: string
}
export interface PullRequest extends Issue {
    diff_url: string
    patch_url: string
    issue_url: string
    number: number
    state: string
    locked: boolean
    user: User,
    merge_commit_sha?: string
    assignees: User[]
    requested_reviewers: User[]
    milestone?: Milestone
    commits_url: string
    review_comments_url: string
    review_comment_url: string
    statuses_url: string
    head: Commit
    base: Commit
    _links: {
        self: {
            href: string
        },
        html: {
            href: string
        },
        issue: {
            href: string
        },
        comments: {
            href: string
        },
        review_comments: {
            href: string
        },
        review_comment: {
            href: string
        },
        commits: {
            href: string
        },
        statuses: {
            href: string
        }
    },
    author_association: string
    merged: boolean
    mergeable?: string
    rebaseable?: string
    mergeable_state: string
    merged_by?: string
    review_comments: number
    maintainer_can_modify: boolean
    commits: number
    additions: number
    deletions: number
    changed_files: number
}
export interface Repository {
    id: number
    name: string
    full_name: string
    owner: User
    private: boolean
    html_url: string
    description: string
    fork: boolean
    url: string
    forks_url: string
    keys_url: string
    collaborators_url: string
    teams_url: string
    hooks_url: string
    issue_events_url: string
    events_url: string
    assignees_url: string
    branches_url: string
    tags_url: string
    blobs_url: string
    git_tags_url: string
    git_refs_url: string
    trees_url: string
    statuses_url: string
    languages_url: string
    stargazers_url: string
    contributors_url: string
    subscribers_url: string
    subscription_url: string
    commits_url: string
    git_commits_url: string
    comments_url: string
    issue_comment_url: string
    contents_url: string
    compare_url: string
    merges_url: string
    archive_url: string
    downloads_url: string
    issues_url: string
    pulls_url: string
    milestones_url: string
    notifications_url: string
    labels_url: string
    releases_url: string
    created_at: string
    updated_at: string
    pushed_at: string
    git_url: string
    ssh_url: string
    clone_url: string
    svn_url: string
    homepage: null
    size: number
    stargazers_count: number
    watchers_count: number
    language: null
    has_issues: boolean
    has_downloads: boolean
    has_wiki: boolean
    has_pages: boolean
    forks_count: number
    mirror_url: null
    open_issues_count: number
    forks: number
    open_issues: number
    watchers: number
    default_branch: string
}
export interface IEvent {
    action: string
    repository: Repository
    sender: User
}
export interface IssuesEvent extends IEvent {
    action: "assigned" | "unassigned" | "labeled" | "unlabeled" | "opened" | "edited" | "milestoned" | "demilestoned" | "closed" | "reopened"
    issue: Issue
    assignee?: User
    label?: Label
}

export interface PullRequestEvent extends IEvent {
    action: "assigned" | "unassigned" | "review_requested" | "review_request_removed" | "labeled" | "unlabeled" | "opened" | "edited" | "closed" | "reopened"
    pull_request: PullRequest
    requested_reviewer?: User
    label?: Label
}

export type Event = IssuesEvent | PullRequestEvent
