param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

if (-not $DatabaseUrl) {
    throw "DATABASE_URL is required"
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$schemaFiles = @(
    (Join-Path $projectRoot "infra/schema/001_init.sql"),
    (Join-Path $projectRoot "infra/schema/003_remove_movies_table.sql")
)

$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlCmd) {
    foreach ($file in $schemaFiles) {
        Write-Host "Applying $file with psql"
        & $psqlCmd.Source $DatabaseUrl -f $file
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply $file"
        }
    }

    Write-Host "Schema applied successfully"
    return
}

$venvPython = Join-Path $projectRoot "backend/.venv/Scripts/python.exe"
$pythonExe = $null

if (Test-Path $venvPython) {
    $pythonExe = $venvPython
}
else {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        $pythonExe = $pythonCmd.Source
    }
}

if (-not $pythonExe) {
    throw "Neither psql nor python was found in PATH. Install PostgreSQL client tools or Python."
}

$tmpPy = Join-Path $env:TEMP "apply_schema_fallback.py"

$pyScript = @'
import pathlib
import sys

import psycopg


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: apply_schema_fallback.py <database_url> <sql_file> [<sql_file> ...]", file=sys.stderr)
        return 2

    database_url = sys.argv[1]
    files = [pathlib.Path(p) for p in sys.argv[2:]]

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            for file in files:
                print(f"Applying {file} with python/psycopg")
                sql = file.read_text(encoding="utf-8")
                cur.execute(sql)
        conn.commit()

    print("Schema applied successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'@

Set-Content -Path $tmpPy -Value $pyScript -Encoding UTF8

try {
    $fallbackDatabaseUrl = $DatabaseUrl -replace '^postgresql\+psycopg://', 'postgresql://'
    & $pythonExe $tmpPy $fallbackDatabaseUrl @($schemaFiles)
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to apply schema via python fallback"
    }
}
finally {
    Remove-Item -Path $tmpPy -ErrorAction SilentlyContinue
}
