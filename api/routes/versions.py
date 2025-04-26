"""
Version control system for UI components and code blocks.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

from flask import jsonify, request
from flask_limiter.util import get_remote_address

from ..security import sanitize_input, check_rate_limit
from ..config import config

logger = logging.getLogger(__name__)

# Version storage directory
VERSIONS_DIR = Path("/tmp/launch/versions")
VERSIONS_DIR.mkdir(parents=True, exist_ok=True)

class VersionManager:
    @staticmethod
    def get_version_file(component_name: str) -> Path:
        """Get the path to the version file for a component."""
        sanitized_name = sanitize_input(component_name)
        return VERSIONS_DIR / f"{sanitized_name}_versions.json"

    @staticmethod
    def load_versions(component_name: str) -> List[Dict]:
        """Load all versions for a component."""
        try:
            version_file = VersionManager.get_version_file(component_name)
            if version_file.exists():
                with open(version_file, "r") as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading versions for {component_name}: {str(e)}")
            return []

    @staticmethod
    def save_version(
        component_name: str,
        code: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        """Save a new version of a component."""
        try:
            versions = VersionManager.load_versions(component_name)
            
            new_version = {
                "id": f"{len(versions) + 1}_{datetime.now().timestamp()}",
                "timestamp": datetime.now().isoformat(),
                "code": code,
                "metadata": metadata or {}
            }
            
            versions.insert(0, new_version)
            
            # Keep only the last 50 versions
            if len(versions) > 50:
                versions = versions[:50]
            
            version_file = VersionManager.get_version_file(component_name)
            with open(version_file, "w") as f:
                json.dump(versions, f, indent=2)
            
            return True
        except Exception as e:
            logger.error(f"Error saving version for {component_name}: {str(e)}")
            return False

    @staticmethod
    def get_version(component_name: str, version_id: str) -> Optional[Dict]:
        """Get a specific version of a component."""
        try:
            versions = VersionManager.load_versions(component_name)
            for version in versions:
                if version["id"] == version_id:
                    return version
            return None
        except Exception as e:
            logger.error(f"Error getting version {version_id} for {component_name}: {str(e)}")
            return None

def register_version_routes(app):
    """Register version control routes with the Flask app."""
    
    @app.route("/api/versions/<component_name>", methods=["GET"])
    @check_rate_limit
    def get_versions(component_name: str):
        """Get all versions for a component."""
        try:
            versions = VersionManager.load_versions(component_name)
            return jsonify({"versions": versions})
        except Exception as e:
            logger.error(f"Error in get_versions: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/versions", methods=["POST"])
    @check_rate_limit
    def save_new_version():
        """Save a new version of a component."""
        try:
            data = request.get_json()
            component_name = sanitize_input(data.get("componentName"))
            code = data.get("code")
            metadata = data.get("metadata", {})
            
            if not component_name or not code:
                return jsonify({"error": "Missing required fields"}), 400
            
            success = VersionManager.save_version(
                component_name=component_name,
                code=code,
                metadata=metadata
            )
            
            if success:
                return jsonify({"message": "Version saved successfully"})
            else:
                return jsonify({"error": "Failed to save version"}), 500
                
        except Exception as e:
            logger.error(f"Error in save_new_version: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/versions/restore", methods=["POST"])
    @check_rate_limit
    def restore_version():
        """Restore a specific version of a component."""
        try:
            data = request.get_json()
            component_name = sanitize_input(data.get("componentName"))
            version_id = data.get("versionId")
            
            if not component_name or not version_id:
                return jsonify({"error": "Missing required fields"}), 400
            
            version = VersionManager.get_version(component_name, version_id)
            if not version:
                return jsonify({"error": "Version not found"}), 404
            
            return jsonify({
                "message": "Version restored successfully",
                "code": version["code"]
            })
            
        except Exception as e:
            logger.error(f"Error in restore_version: {str(e)}")
            return jsonify({"error": str(e)}), 500
