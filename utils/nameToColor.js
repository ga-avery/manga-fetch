/**
 * Generate personalized colors based on a given name :D
 * @param {string} name 
 * @returns css compatible hex-color
 */
const nameToColor = name => ('#' + parseInt(name, 36)
                                    .toString(16)
                                    .padStart(8, '0'))
                            .slice(0, 9);
export default nameToColor;