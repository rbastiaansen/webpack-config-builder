import { Adapter, NextCallback } from '../Adapter';
import { Configuration, Plugin } from 'webpack';
import { BuilderConfig } from '../../Builder';
import path from 'path';
import { validateIfRequiredModuleIsInstalled } from '../../utility/moduleHelper';

// @todo use types from @types/copy-webpack-plugin instead (cannot export StringPattern / ObjectPattern right now)
type StringPattern = string;
interface ObjectPattern {
    from: string;
    to?: string;
    context?: string;
    globOptions?: object;
    toType?: 'file' | 'dir' | 'template';
    force?: boolean;
    flatten?: boolean;
    transform?: (content: Buffer, absoluteFrom: string) => string | Buffer | Promise<string | Buffer>;
    cacheTransform?: boolean | string | object;
    transformPath?: (targetPath: string, absolutePath: string) => string | Promise<string>;
    noErrorOnMissing?: boolean;
}

export type Config = {
    images: boolean;
    additionalPatterns: Array<StringPattern | ObjectPattern>;
};

export const DEFAULT_CONFIG: Config = {
    images: false,
    additionalPatterns: [],
};

export default class CopyFilesToBuildDirAdapter implements Adapter {
    private config: Config;

    constructor(config: Partial<Config>) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };
    }

    public apply(
        webpackConfig: Configuration,
        _builderConfig: BuilderConfig,
        next: NextCallback
    ) {
        const patterns: Array<StringPattern | ObjectPattern> = [];

        if (this.config.images) {
            patterns.push({
                from: '**/*',
                context: path.resolve(process.cwd(), 'src/images/'), // context reference for path placeholder and from glob
                to: 'images/[path][name].[contenthash].[ext]', // contenthash is required even on dev env as required by webpack_assets extension
            });
        }

        patterns.push(...this.config.additionalPatterns);

        if (patterns.length > 0) {
            validateIfRequiredModuleIsInstalled(
                'CopyFilesToBuildDirAdapter',
                'copy-webpack-plugin',
                '6.0.0'
            );

            const CopyWebpackPlugin = require('copy-webpack-plugin');

            if (typeof webpackConfig.plugins === 'undefined') {
                webpackConfig.plugins = [];
            }

            const options = {};

            const pluginInstance: Plugin = new CopyWebpackPlugin({
                patterns,
                options
            });

            webpackConfig.plugins.push(pluginInstance);
        }

        next();
    }
}
