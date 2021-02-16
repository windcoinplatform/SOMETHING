import React from 'react';

const socialLinks = [{
    id: 'github',
    url: 'http://134.209.75.3:8080/custom'

}];

const Footer = ({version}) => {
    return (
        <div className="menu-footer">
            <div>Version</div>
            <div>KSS Team</div>
            <div>
                {socialLinks.map(item =>
                    (<a key={item.id} className={`social ${item.id}`} href={item.url} target="_blank"></a>))}
            </div>
            <div>
                <a className="fade" href="http://134.209.75.3:8080/custom" target="_blank">KSS</a>
            </div>
        </div>
    );
}

export default Footer;
