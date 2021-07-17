
import { spawn, exec } from "child_process";
import { join } from "path";

interface backup {
    binPath?: string,
    host: string,
    port: string,
    username: string,
    password: string,
    file: string,
    database: string
}

export default {

    backup(params: backup, callback?: Function): Promise<void | Error> {
        let pathBin = params.binPath ? join(params.binPath, 'pg_dump.exe') : 'pg_dump.exe';
        let str = `SET PGPASSWORD=${params.password}`;
        let backupStr = `"${pathBin}" --host ${params.host} --port ${params.port} --username "${params.username}"  --verbose --file "${params.file}" "${params.database}"`;

        // let paramsScript = [`--host ${params.host}`, `-username "${params.username}"`, `--verbose`, `--file "${params.file}"`, "${params.database}"];
        let paramsScript = [backupStr];


        // console.log(str + " \n " + backupStr)
        return new Promise((resolve, reject) => {

            let ls = spawn(pathBin, paramsScript);

            
            process.stdin.pipe(ls.stdin)
            // setTimeout(() => {
            //     ls.stdin.write("admin\n");
            //     // ls.stdin.end();
            // }, 1000);


            ls.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });
            
            ls.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
            });
            
            ls.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });

            
            //     exec(str + " \n " + backupStr, (error, stdout, stderr) => {
            //         if (error) {
            //             return reject(error);
            //         }
            //         resolve();
            //     });
        })

    }
};