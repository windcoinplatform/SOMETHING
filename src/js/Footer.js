import React from 'react';

const socialLinks = [{
    id: 'github',
    url: 'http://161.97.178.27:8080/custom'
}, {
    id: 'twitter',
    url: 'http://161.97.178.27:8080/custom'
}, {
    id: 'facebook',
    url: 'http://161.97.178.27:8080/custom'
}, {
    id: 'discord',
    url: 'http://161.97.178.27:8080/custom'
}, {
    id: 'telegram',
    url: 'http://161.97.178.27:8080/custom'
}, {
    id: 'reddit',
    url: 'http://161.97.178.27:8080/custom'
}];

const Footer = ({version}) => {
    return (
        <div className="menu-footer">
            <div>Version</div>
            <div>SOMETHING Team</div>
            <div>
                {socialLinks.map(item =>
                    (<a key={item.id} className={`social ${item.id}`} href={item.url} target="_blank"></a>))}
            </div>
            <div>
                <a className="fade" href="http://144.91.84.27:60863" target="_blank">SOMETHINGWALLET</a>
            </div>
        </div>
    );
}

export default Footer;
