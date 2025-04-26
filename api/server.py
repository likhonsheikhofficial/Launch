/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

import uvicorn

if __name__ == "__main__":
    uvicorn.run("index:app", host="0.0.0.0", port=8000)
