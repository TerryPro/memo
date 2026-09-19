use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

use serde::{Deserialize, Serialize};
use tauri::webview::PageLoadEvent;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_opener::OpenerExt;

const PHOTO_EXTENSIONS: [&str; 6] = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PhotoMeta {
    id: String,
    path: String,
    name: String,
    width: u32,
    height: u32,
    size: u64,
    modified: Option<u64>,
}

fn is_photo(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            PHOTO_EXTENSIONS
                .iter()
                .any(|allowed| allowed.eq_ignore_ascii_case(ext))
        })
        .unwrap_or(false)
}

fn modified_millis(meta: &fs::Metadata) -> Option<u64> {
    meta.modified()
        .ok()?
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|d| d.as_millis() as u64)
}

fn collect_photos(dir: &Path, out: &mut Vec<PhotoMeta>) {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        let meta = match entry.metadata() {
            Ok(meta) => meta,
            Err(_) => continue,
        };

        if meta.is_dir() {
            collect_photos(&path, out);
            continue;
        }

        if !is_photo(&path) {
            continue;
        }

        // Read only the header to get dimensions cheaply.
        let (width, height) = image::image_dimensions(&path).unwrap_or((0, 0));
        let path_str = path.to_string_lossy().to_string();
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path_str.clone());

        out.push(PhotoMeta {
            id: path_str.clone(),
            path: path_str,
            name,
            width,
            height,
            size: meta.len(),
            modified: modified_millis(&meta),
        });
    }
}

fn insert_tag(
    map: &mut serde_json::Map<String, serde_json::Value>,
    key: &str,
    exif: &exif::Exif,
    tag: exif::Tag,
) {
    if let Some(field) = exif.get_field(tag, exif::In::PRIMARY) {
        map.insert(
            key.to_string(),
            serde_json::Value::String(field.display_value().to_string()),
        );
    }
}

fn gps_decimal(exif: &exif::Exif, coord: exif::Tag, ref_tag: exif::Tag) -> Option<f64> {
    let field = exif.get_field(coord, exif::In::PRIMARY)?;
    let exif::Value::Rational(values) = &field.value else {
        return None;
    };
    if values.len() < 3 {
        return None;
    }
    let mut decimal = values[0].to_f64() + values[1].to_f64() / 60.0 + values[2].to_f64() / 3600.0;

    if let Some(ref_field) = exif.get_field(ref_tag, exif::In::PRIMARY) {
        let ref_value = ref_field.display_value().to_string();
        if ref_value.starts_with('S') || ref_value.starts_with('W') {
            decimal = -decimal;
        }
    }

    Some(decimal)
}

#[tauri::command]
fn read_exif(path: String) -> Result<serde_json::Value, String> {
    let file = fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut reader = std::io::BufReader::new(file);

    let exif = exif::Reader::new()
        .read_from_container(&mut reader)
        .map_err(|e| e.to_string())?;

    let mut map = serde_json::Map::new();

    insert_tag(&mut map, "make", &exif, exif::Tag::Make);
    insert_tag(&mut map, "model", &exif, exif::Tag::Model);
    insert_tag(&mut map, "software", &exif, exif::Tag::Software);
    insert_tag(&mut map, "artist", &exif, exif::Tag::Artist);
    insert_tag(&mut map, "copyright", &exif, exif::Tag::Copyright);
    insert_tag(&mut map, "lensMake", &exif, exif::Tag::LensMake);
    insert_tag(&mut map, "lensModel", &exif, exif::Tag::LensModel);

    insert_tag(&mut map, "dateTimeOriginal", &exif, exif::Tag::DateTimeOriginal);
    insert_tag(&mut map, "exposureTime", &exif, exif::Tag::ExposureTime);
    insert_tag(&mut map, "shutterSpeed", &exif, exif::Tag::ShutterSpeedValue);
    insert_tag(&mut map, "fNumber", &exif, exif::Tag::FNumber);
    insert_tag(&mut map, "aperture", &exif, exif::Tag::ApertureValue);
    insert_tag(&mut map, "iso", &exif, exif::Tag::PhotographicSensitivity);
    insert_tag(&mut map, "exposureProgram", &exif, exif::Tag::ExposureProgram);
    insert_tag(&mut map, "exposureBias", &exif, exif::Tag::ExposureBiasValue);
    insert_tag(&mut map, "focalLength", &exif, exif::Tag::FocalLength);
    insert_tag(
        &mut map,
        "focalLength35mm",
        &exif,
        exif::Tag::FocalLengthIn35mmFilm,
    );
    insert_tag(&mut map, "flash", &exif, exif::Tag::Flash);
    insert_tag(&mut map, "lightSource", &exif, exif::Tag::LightSource);
    insert_tag(&mut map, "meteringMode", &exif, exif::Tag::MeteringMode);
    insert_tag(&mut map, "whiteBalance", &exif, exif::Tag::WhiteBalance);
    insert_tag(&mut map, "colorSpace", &exif, exif::Tag::ColorSpace);
    insert_tag(&mut map, "orientation", &exif, exif::Tag::Orientation);
    insert_tag(&mut map, "brightness", &exif, exif::Tag::BrightnessValue);

    if let Some(field) = exif.get_field(exif::Tag::PixelXDimension, exif::In::PRIMARY) {
        map.insert(
            "pixelWidth".to_string(),
            serde_json::Value::String(field.display_value().to_string()),
        );
    }
    if let Some(field) = exif.get_field(exif::Tag::PixelYDimension, exif::In::PRIMARY) {
        map.insert(
            "pixelHeight".to_string(),
            serde_json::Value::String(field.display_value().to_string()),
        );
    }

    if let Some(lat) = gps_decimal(&exif, exif::Tag::GPSLatitude, exif::Tag::GPSLatitudeRef) {
        map.insert(
            "gpsLatitude".to_string(),
            serde_json::json!(lat),
        );
    }
    if let Some(lon) = gps_decimal(&exif, exif::Tag::GPSLongitude, exif::Tag::GPSLongitudeRef) {
        map.insert(
            "gpsLongitude".to_string(),
            serde_json::json!(lon),
        );
    }
    insert_tag(&mut map, "gpsAltitude", &exif, exif::Tag::GPSAltitude);

    Ok(serde_json::Value::Object(map))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AlbumGroup {
    id: String,
    name: String,
    path: String,
    photos: Vec<PhotoMeta>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LibraryScan {
    root: String,
    albums: Vec<AlbumGroup>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AlbumMeta {
    id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cover_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    favorite: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    hidden: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    position: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    updated_at: Option<u64>,
}

const UNFILED_ALBUM_NAME: &str = "\u{672a}\u{5f52}\u{7c7b}";

#[tauri::command]
fn scan_library(app: AppHandle, root: String) -> Result<LibraryScan, String> {
    let root_path = Path::new(&root);
    if !root_path.is_dir() {
        return Err(format!("not a directory: {}", root));
    }

    // Allow the webview to load images from this whole tree via the asset protocol.
    if let Err(err) = app.asset_protocol_scope().allow_directory(root_path, true) {
        log::warn!("failed to extend asset protocol scope: {}", err);
    }

    let mut photos = Vec::new();
    collect_photos(root_path, &mut photos);

    let mut grouped: HashMap<String, Vec<PhotoMeta>> = HashMap::new();
    let mut loose: Vec<PhotoMeta> = Vec::new();

    for photo in photos {
        let relative = Path::new(&photo.path).strip_prefix(root_path);
        let components: Vec<_> = match relative {
            Ok(rel) => rel.components().collect(),
            Err(_) => {
                loose.push(photo);
                continue;
            }
        };

        if components.len() <= 1 {
            // Directly under the root folder.
            loose.push(photo);
        } else {
            let folder = components[0].as_os_str().to_string_lossy().to_string();
            grouped.entry(folder).or_default().push(photo);
        }
    }

    let mut albums: Vec<AlbumGroup> = Vec::new();

    if !loose.is_empty() {
        loose.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        albums.push(AlbumGroup {
            id: root.clone(),
            name: UNFILED_ALBUM_NAME.to_string(),
            path: root.clone(),
            photos: loose,
        });
    }

    for (folder, mut folder_photos) in grouped {
        folder_photos.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        let album_path = root_path.join(&folder);
        let album_path_str = album_path.to_string_lossy().to_string();
        albums.push(AlbumGroup {
            id: album_path_str.clone(),
            name: folder,
            path: album_path_str,
            photos: folder_photos,
        });
    }

    // Keep the virtual "unfiled" album first, then sort the rest by name.
    let (unfiled, mut rest): (Vec<_>, Vec<_>) = albums
        .into_iter()
        .partition(|album| album.name == UNFILED_ALBUM_NAME);
    rest.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    let mut sorted = unfiled;
    sorted.append(&mut rest);

    log::info!("scanned library at {} into {} albums", root, sorted.len());
    Ok(LibraryScan {
        root,
        albums: sorted,
    })
}

fn album_meta_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("albums.json"))
}

#[tauri::command]
fn load_album_meta(app: AppHandle) -> Result<Vec<AlbumMeta>, String> {
    let path = album_meta_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }
    let metas: Vec<AlbumMeta> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(metas)
}

#[tauri::command]
fn save_album_meta(app: AppHandle, albums: Vec<AlbumMeta>) -> Result<(), String> {
    let path = album_meta_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&albums).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Todo {
    id: String,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    notes: Option<String>,
    completed: bool,
    priority: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    due_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    category: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    position: i64,
    created_at: u64,
    updated_at: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    completed_at: Option<u64>,
}

fn todo_store_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("todos.json"))
}

#[tauri::command]
fn load_todos(app: AppHandle) -> Result<Vec<Todo>, String> {
    let path = todo_store_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }
    let todos: Vec<Todo> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(todos)
}

#[tauri::command]
fn save_todos(app: AppHandle, todos: Vec<Todo>) -> Result<(), String> {
    let path = todo_store_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&todos).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Repo {
    id: String,
    owner: String,
    name: String,
    full_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    homepage: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    language: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    license: Option<String>,
    #[serde(default)]
    topics: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stars: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    forks: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    watchers: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    open_issues: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pushed_at: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    latest_release: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    release_published_at: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    release_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    category: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    starred: bool,
    status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    notes: Option<String>,
    position: i64,
    created_at: u64,
    updated_at: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    last_synced_at: Option<u64>,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct RepoSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    github_token: Option<String>,
    #[serde(default)]
    auto_sync_on_open: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RepoFetched {
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    homepage: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    language: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    license: Option<String>,
    topics: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stars: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    forks: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    watchers: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    open_issues: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pushed_at: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    latest_release: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    release_published_at: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    release_url: Option<String>,
}

#[derive(Deserialize)]
struct GithubLicense {
    spdx_id: Option<String>,
}

#[derive(Deserialize)]
struct GithubRepo {
    description: Option<String>,
    homepage: Option<String>,
    language: Option<String>,
    license: Option<GithubLicense>,
    topics: Option<Vec<String>>,
    stargazers_count: Option<u64>,
    forks_count: Option<u64>,
    subscribers_count: Option<u64>,
    open_issues_count: Option<u64>,
    pushed_at: Option<String>,
}

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: Option<String>,
    published_at: Option<String>,
    html_url: Option<String>,
}

fn rfc3339_to_millis(value: &str) -> Option<u64> {
    chrono::DateTime::parse_from_rfc3339(value)
        .ok()
        .map(|dt| dt.timestamp_millis().max(0) as u64)
}

fn repo_store_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("repos.json"))
}

fn settings_store_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("settings.json"))
}

#[tauri::command]
fn load_repos(app: AppHandle) -> Result<Vec<Repo>, String> {
    let path = repo_store_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }
    let repos: Vec<Repo> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(repos)
}

#[tauri::command]
fn save_repos(app: AppHandle, repos: Vec<Repo>) -> Result<(), String> {
    let path = repo_store_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&repos).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Result<RepoSettings, String> {
    let path = settings_store_path(&app)?;
    if !path.exists() {
        return Ok(RepoSettings::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(RepoSettings::default());
    }
    let settings: RepoSettings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: RepoSettings) -> Result<(), String> {
    let path = settings_store_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

fn github_token(token: Option<&str>) -> Option<String> {
    token
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .map(|value| value.to_string())
}

#[tauri::command]
async fn fetch_repo(owner: String, name: String, token: Option<String>) -> Result<RepoFetched, String> {
    let client = reqwest::Client::builder()
        .user_agent("memo-github-tracker")
        .build()
        .map_err(|e| format!("初始化 HTTP 客户端失败: {}", e))?;

    let auth = github_token(token.as_deref());

    let repo_url = format!("https://api.github.com/repos/{}/{}", owner, name);
    let mut repo_request = client
        .get(&repo_url)
        .header("Accept", "application/vnd.github+json");
    if let Some(token) = auth.as_deref() {
        repo_request = repo_request.header("Authorization", format!("Bearer {}", token));
    }

    let repo_response = repo_request
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;
    let status = repo_response.status();

    if status == reqwest::StatusCode::NOT_FOUND {
        return Err("仓库不存在或为私有仓库".to_string());
    }
    if status == reqwest::StatusCode::FORBIDDEN || status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return Err("已触达 GitHub 速率限制，请配置 Token 或稍后再试".to_string());
    }
    if !status.is_success() {
        return Err(format!("GitHub 返回错误状态: {}", status.as_u16()));
    }

    let repo: GithubRepo = repo_response
        .json()
        .await
        .map_err(|e| format!("解析仓库响应失败: {}", e))?;

    let release_url = format!(
        "https://api.github.com/repos/{}/{}/releases/latest",
        owner, name
    );
    let mut release_request = client
        .get(&release_url)
        .header("Accept", "application/vnd.github+json");
    if let Some(token) = auth.as_deref() {
        release_request = release_request.header("Authorization", format!("Bearer {}", token));
    }

    let release = match release_request.send().await {
        Ok(response) if response.status().is_success() => {
            response.json::<GithubRelease>().await.ok()
        }
        _ => None,
    };

    Ok(RepoFetched {
        description: repo.description.filter(|value| !value.is_empty()),
        homepage: repo.homepage.filter(|value| !value.is_empty()),
        language: repo.language,
        license: repo
            .license
            .and_then(|license| license.spdx_id)
            .filter(|value| value != "NOASSERTION"),
        topics: repo.topics.unwrap_or_default(),
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.subscribers_count,
        open_issues: repo.open_issues_count,
        pushed_at: repo.pushed_at.as_deref().and_then(rfc3339_to_millis),
        latest_release: release.as_ref().and_then(|item| item.tag_name.clone()),
        release_published_at: release
            .as_ref()
            .and_then(|item| item.published_at.as_deref())
            .and_then(rfc3339_to_millis),
        release_url: release.and_then(|item| item.html_url),
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RateLimit {
    limit: u64,
    remaining: u64,
    used: u64,
    reset: u64,
}

fn read_u64(value: &serde_json::Value, key: &str) -> u64 {
    value
        .get(key)
        .and_then(|item| item.as_u64())
        .unwrap_or(0)
}

#[tauri::command]
async fn check_rate_limit(token: Option<String>) -> Result<RateLimit, String> {
    let client = reqwest::Client::builder()
        .user_agent("memo-github-tracker")
        .build()
        .map_err(|e| format!("初始化 HTTP 客户端失败: {}", e))?;

    let mut request = client
        .get("https://api.github.com/rate_limit")
        .header("Accept", "application/vnd.github+json");
    if let Some(token) = github_token(token.as_deref()) {
        request = request.header("Authorization", format!("Bearer {}", token));
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("获取速率限额失败: {}", status.as_u16()));
    }

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let Some(core) = body
        .get("resources")
        .and_then(|resources| resources.get("core"))
    else {
        return Err("响应缺少速率限额字段".to_string());
    };

    Ok(RateLimit {
        limit: read_u64(core, "limit"),
        remaining: read_u64(core, "remaining"),
        used: read_u64(core, "used"),
        reset: read_u64(core, "reset"),
    })
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct LibrarySettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    root: Option<String>,
}

fn library_store_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("library.json"))
}

#[tauri::command]
fn load_library_root(app: AppHandle) -> Result<Option<String>, String> {
    let path = library_store_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(None);
    }
    let settings: LibrarySettings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(settings.root)
}

#[tauri::command]
fn save_library_root(app: AppHandle, root: Option<String>) -> Result<(), String> {
    let path = library_store_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let settings = LibrarySettings { root };
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct RepoCategoryStore {
    #[serde(default)]
    categories: Vec<String>,
}

fn repo_category_store_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("repo-categories.json"))
}

#[tauri::command]
fn load_repo_categories(app: AppHandle) -> Result<Vec<String>, String> {
    let path = repo_category_store_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }
    let store: RepoCategoryStore = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(store.categories)
}

#[tauri::command]
fn save_repo_categories(app: AppHandle, categories: Vec<String>) -> Result<(), String> {
    let path = repo_category_store_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let store = RepoCategoryStore { categories };
    let content = serde_json::to_string_pretty(&store).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

fn external_navigation_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::<R>::new("external-navigation")
        .on_navigation(|webview, url| {
            let is_internal_host = matches!(
                url.host_str(),
                Some("localhost") | Some("127.0.0.1") | Some("tauri.localhost") | Some("::1")
            );

            let is_internal = url.scheme() == "tauri" || is_internal_host;

            if is_internal {
                return true;
            }

            let is_external_link = matches!(url.scheme(), "http" | "https" | "mailto" | "tel");

            if is_external_link {
                log::info!("opening external link in system browser: {}", url);
                let _ = webview.opener().open_url(url.as_str(), None::<&str>);
                return false;
            }

            true
        })
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(external_navigation_plugin())
        .invoke_handler(tauri::generate_handler![
            read_exif,
            scan_library,
            load_album_meta,
            save_album_meta,
            load_todos,
            save_todos,
            load_repos,
            save_repos,
            load_settings,
            save_settings,
            fetch_repo,
            check_rate_limit,
            load_library_root,
            save_library_root,
            load_repo_categories,
            save_repo_categories
        ])
        .on_page_load(|webview, payload| {
            if webview.label() == "main" && matches!(payload.event(), PageLoadEvent::Finished) {
                log::info!("main webview finished loading");
                let _ = webview.window().show();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
